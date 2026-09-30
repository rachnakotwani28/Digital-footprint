import type { Account } from '../types/account';
import type { ExposureNetwork, GraphEdge, GraphNode, RiskTier } from '../types/graph';

export type LayoutMode = 'concentric' | 'hierarchical' | 'cluster';

export interface AttackPath {
  nodes: string[];
  edges: GraphEdge[];
  cumulativeRisk: number;
  description: string[];
}

export function buildExposureNetwork(
  accounts: Account[],
  layoutMode: LayoutMode = 'concentric'
): ExposureNetwork {
  const accountMap = new Map<string, Account>();
  accounts.forEach((acc) => accountMap.set(acc.id, acc));

  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  const addEdge = (
    source: string,
    target: string,
    relationType: GraphEdge['relationType'],
    weight: number,
    label: string
  ) => {
    if (source === target) return;
    if (!accountMap.has(source) || !accountMap.has(target)) return;
    const key = `${source}->${target}:${relationType}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({
        id: `edge_${source}_${target}_${relationType}`,
        source,
        target,
        relationType,
        weight,
        label,
      });
    }
  };

  // 1. SSO Authentication Delegation Edges
  accounts.forEach((acc) => {
    if (acc.ssoParentId && acc.ssoParentId !== acc.id) {
      addEdge(acc.ssoParentId, acc.id, 'SSO_AUTH', 0.95, 'SSO Sign-In Provider');
    }
  });

  // 2. Email Recovery Mechanism Edges
  accounts.forEach((acc) => {
    if (acc.recoveryEmailAccountId && acc.recoveryEmailAccountId !== acc.id) {
      addEdge(acc.recoveryEmailAccountId, acc.id, 'RECOVERY_CHANNEL', 0.85, 'Password Recovery Channel');
    }
  });

  // 3. Zero-Knowledge Password Reuse Lateral Bridges
  const clusterGroups = new Map<string, string[]>();
  accounts.forEach((acc) => {
    if (acc.passwordClusterId && !acc.passwordClusterId.includes('unique')) {
      const list = clusterGroups.get(acc.passwordClusterId) || [];
      list.push(acc.id);
      clusterGroups.set(acc.passwordClusterId, list);
    }
  });

  clusterGroups.forEach((members) => {
    if (members.length > 1) {
      for (let i = 0; i < members.length; i++) {
        for (let j = 0; j < members.length; j++) {
          if (i !== j) {
            addEdge(members[i], members[j], 'PASSWORD_REUSE', 0.75, 'Shared Password Group');
          }
        }
      }
    }
  });

  // Adjacency matrices
  const forwardAdj = new Map<string, string[]>();
  const reverseAdj = new Map<string, string[]>();

  accounts.forEach((acc) => {
    forwardAdj.set(acc.id, []);
    reverseAdj.set(acc.id, []);
  });

  edges.forEach((edge) => {
    forwardAdj.get(edge.source)?.push(edge.target);
    reverseAdj.get(edge.target)?.push(edge.source);
  });

  // Reachability Analysis (Downstream Blast Radius)
  const getDownstreamBlastRadius = (startId: string): string[] => {
    const visited = new Set<string>();
    const queue = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors = forwardAdj.get(curr) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }
    visited.delete(startId);
    return Array.from(visited);
  };

  // Upstream Controlling Sources
  const getUpstreamExposure = (startId: string): string[] => {
    const visited = new Set<string>();
    const queue = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const parents = reverseAdj.get(curr) || [];
      for (const p of parents) {
        if (!visited.has(p)) {
          visited.add(p);
          queue.push(p);
        }
      }
    }
    visited.delete(startId);
    return Array.from(visited);
  };

  // Node Positions based on selected Layout Mode
  const positions = computeNodeLayout(accounts, forwardAdj, layoutMode);

  // Assemble Graph Nodes
  const nodes: GraphNode[] = accounts.map((acc) => {
    const downstream = getDownstreamBlastRadius(acc.id);
    const upstream = getUpstreamExposure(acc.id);

    const baseRisk = computeNodeBaseRisk(acc);
    const isSPOF =
      (downstream.length >= 3 ||
        (acc.serviceCategory === 'identity_email' && downstream.length >= 2)) &&
      (!acc.has2FA || baseRisk >= 50);

    const riskTier = getRiskTier(baseRisk);
    const pos = positions.get(acc.id) || { x: 500, y: 380 };

    return {
      id: acc.id,
      name: acc.name,
      category: acc.serviceCategory,
      baseRisk,
      effectiveRisk: baseRisk,
      riskTier,
      isSPOF,
      downstreamBlastRadiusCount: downstream.length,
      upstreamExposureCount: upstream.length,
      account: acc,
      x: pos.x,
      y: pos.y,
    };
  });

  return { nodes, edges };
}

/**
 * Multi-mode layout geometry calculations
 */
function computeNodeLayout(
  accounts: Account[],
  forwardAdj: Map<string, string[]>,
  mode: LayoutMode
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const total = Math.max(accounts.length, 1);

  if (mode === 'concentric') {
    // Identity hubs & SPOFs in center ring, sensitive in middle ring, peripheral apps in outer ring
    accounts.forEach((acc, index) => {
      const outDegree = forwardAdj.get(acc.id)?.length || 0;
      const isHub = acc.serviceCategory === 'identity_email' || outDegree >= 3;
      const isSensitive = acc.sensitivityWeight >= 8;

      let radius = 290 + (index % 3) * 35;
      if (isHub) radius = 130 + (index % 2) * 30;
      else if (isSensitive) radius = 210 + (index % 2) * 25;

      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      positions.set(acc.id, {
        x: Math.round(500 + radius * Math.cos(angle)),
        y: Math.round(380 + radius * Math.sin(angle)),
      });
    });
  } else if (mode === 'hierarchical') {
    // Identity & Auth Providers top level (Y=140), Middle services (Y=380), Endpoints (Y=620)
    const tiers: { top: Account[]; mid: Account[]; bot: Account[] } = { top: [], mid: [], bot: [] };
    accounts.forEach((acc) => {
      if (acc.serviceCategory === 'identity_email' || (acc.ssoParentId === undefined && acc.recoveryEmailAccountId === undefined)) {
        tiers.top.push(acc);
      } else if (acc.sensitivityWeight >= 7) {
        tiers.mid.push(acc);
      } else {
        tiers.bot.push(acc);
      }
    });

    const assignRow = (rowAccounts: Account[], yPos: number) => {
      const step = 840 / Math.max(rowAccounts.length + 1, 2);
      rowAccounts.forEach((acc, idx) => {
        positions.set(acc.id, {
          x: Math.round(80 + (idx + 1) * step),
          y: yPos + (idx % 2 === 1 ? 25 : -25),
        });
      });
    };

    assignRow(tiers.top, 150);
    assignRow(tiers.mid, 380);
    assignRow(tiers.bot, 610);
  } else {
    // Cluster layout: group by Category
    const categories = Array.from(new Set(accounts.map((a) => a.serviceCategory)));
    const clusterCenters = new Map<string, { cx: number; cy: number }>();
    categories.forEach((cat, idx) => {
      const angle = (idx / categories.length) * 2 * Math.PI;
      clusterCenters.set(cat, {
        cx: 500 + 240 * Math.cos(angle),
        cy: 380 + 200 * Math.sin(angle),
      });
    });

    accounts.forEach((acc, idx) => {
      const center = clusterCenters.get(acc.serviceCategory) || { cx: 500, cy: 380 };
      const subAngle = (idx * 1.5) % (2 * Math.PI);
      const subRadius = 45 + (idx % 3) * 20;
      positions.set(acc.id, {
        x: Math.round(center.cx + subRadius * Math.cos(subAngle)),
        y: Math.round(center.cy + subRadius * Math.sin(subAngle)),
      });
    });
  }

  return positions;
}

/**
 * Shortest attack path calculation (BFS)
 */
export function findAttackPath(
  sourceId: string,
  targetId: string,
  network: ExposureNetwork
): AttackPath | null {
  if (sourceId === targetId) return null;

  const adj = new Map<string, Array<{ target: string; edge: GraphEdge }>>();
  network.nodes.forEach((n) => adj.set(n.id, []));
  network.edges.forEach((e) => {
    adj.get(e.source)?.push({ target: e.target, edge: e });
  });

  const queue: Array<{ curr: string; path: string[]; edges: GraphEdge[] }> = [
    { curr: sourceId, path: [sourceId], edges: [] },
  ];
  const visited = new Set<string>();
  visited.add(sourceId);

  while (queue.length > 0) {
    const { curr, path, edges } = queue.shift()!;
    if (curr === targetId) {
      const descriptions = edges.map((e, idx) => {
        const srcNode = network.nodes.find((n) => n.id === e.source);
        const tgtNode = network.nodes.find((n) => n.id === e.target);
        return `Step ${idx + 1}: ${srcNode?.name || e.source} compromises ${tgtNode?.name || e.target} via ${e.label}.`;
      });
      return {
        nodes: path,
        edges,
        cumulativeRisk: Math.round(edges.reduce((sum, e) => sum + e.weight * 30, 20)),
        description: descriptions,
      };
    }

    const neighbors = adj.get(curr) || [];
    for (const { target, edge } of neighbors) {
      if (!visited.has(target)) {
        visited.add(target);
        queue.push({
          curr: target,
          path: [...path, target],
          edges: [...edges, edge],
        });
      }
    }
  }

  return null;
}

export function computeNodeBaseRisk(acc: Account): number {
  let score = 15;

  if (!acc.has2FA) {
    score += 35;
  } else if (acc.twoFactorType === 'sms') {
    score += 10;
  } else if (acc.twoFactorType === 'hardware_key') {
    score -= 10;
  }

  if (acc.passwordClusterId && !acc.passwordClusterId.includes('unique')) {
    score += 25;
  }

  score += Math.min(acc.knownBreachesCount * 15, 30);

  const permissionRiskMap: Record<string, number> = {
    camera: 6,
    microphone: 7,
    precise_location: 8,
    contacts: 7,
    photos_storage: 6,
    financial_data: 9,
    background_tracking: 8,
  };

  acc.permissions.forEach((perm) => {
    score += (permissionRiskMap[perm] || 4) * 0.7;
  });

  return Math.min(100, Math.max(5, Math.round(score)));
}

export function getRiskTier(score: number): RiskTier {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}
