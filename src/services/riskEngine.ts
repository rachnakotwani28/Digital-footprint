import type { Account } from '../types/account';
import type { ExposureNetwork, GraphNode } from '../types/graph';
import type { RemediationAction, RiskMetrics } from '../types/risk';
import { buildExposureNetwork, getRiskTier } from './graphEngine';

export function calculateEffectiveNetworkRisk(network: ExposureNetwork): ExposureNetwork {
  const { nodes, edges } = network;
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach((n) => nodeMap.set(n.id, { ...n }));

  // Build incoming edge map
  const inEdges = new Map<string, Array<{ source: string; weight: number }>>();
  nodes.forEach((n) => inEdges.set(n.id, []));

  edges.forEach((edge) => {
    inEdges.get(edge.target)?.push({ source: edge.source, weight: edge.weight });
  });

  // Iterative propagation (3 rounds with damping)
  const DAMPING = 0.30;
  for (let round = 0; round < 3; round++) {
    const nextScores = new Map<string, number>();

    nodes.forEach((node) => {
      const current = nodeMap.get(node.id)!;
      let inheritedRisk = 0;
      const parents = inEdges.get(node.id) || [];

      parents.forEach((edge) => {
        const parentNode = nodeMap.get(edge.source);
        if (parentNode) {
          inheritedRisk += parentNode.effectiveRisk * edge.weight * DAMPING;
        }
      });

      const sensitivityBoost = (current.account.sensitivityWeight / 10) * 0.4 + 0.6;
      const rawEffective = current.baseRisk + inheritedRisk * sensitivityBoost;
      nextScores.set(node.id, Math.min(100, Math.round(rawEffective)));
    });

    nextScores.forEach((score, id) => {
      const node = nodeMap.get(id);
      if (node) {
        node.effectiveRisk = score;
        node.riskTier = getRiskTier(score);
      }
    });
  }

  // Update SPOF flags based on both effective risk and blast radius
  nodes.forEach((node) => {
    const updated = nodeMap.get(node.id)!;
    updated.isSPOF =
      (updated.downstreamBlastRadiusCount >= 3 ||
        (updated.account.serviceCategory === 'identity_email' && updated.downstreamBlastRadiusCount >= 2)) &&
      (!updated.account.has2FA || updated.effectiveRisk >= 50);
  });

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}

export function computeRiskMetrics(network: ExposureNetwork): RiskMetrics {
  const { nodes } = network;
  if (nodes.length === 0) {
    return {
      overallPrivacyScore: 100,
      grade: 'A+',
      totalAccounts: 0,
      criticalAccountsCount: 0,
      highRiskAccountsCount: 0,
      spofCount: 0,
      passwordClusterCount: 0,
      reusedPasswordAccountsCount: 0,
      missing2FACount: 0,
      highRiskPermissionsCount: 0,
      totalNetworkRiskScore: 0,
      tierBreakdown: { critical: 0, high: 0, moderate: 0, low: 0 },
    };
  }

  let totalWeightedRisk = 0;
  let totalWeights = 0;
  let criticalCount = 0;
  let highRiskCount = 0;
  let spofCount = 0;
  let missing2FA = 0;
  let reusedCount = 0;
  let highPermCount = 0;

  const clusterCounts = new Map<string, number>();
  const tierBreakdown: Record<string, number> = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
  };

  nodes.forEach((node) => {
    const weight = node.account.sensitivityWeight;
    totalWeightedRisk += node.effectiveRisk * weight;
    totalWeights += weight;

    if (node.effectiveRisk >= 75) criticalCount++;
    else if (node.effectiveRisk >= 50) highRiskCount++;

    if (node.isSPOF) spofCount++;
    if (!node.account.has2FA) missing2FA++;

    if (node.account.passwordClusterId && !node.account.passwordClusterId.includes('unique')) {
      reusedCount++;
      clusterCounts.set(
        node.account.passwordClusterId,
        (clusterCounts.get(node.account.passwordClusterId) || 0) + 1
      );
    }

    if (node.account.permissions.length >= 3) {
      highPermCount++;
    }

    tierBreakdown[node.riskTier] = (tierBreakdown[node.riskTier] || 0) + 1;
  });

  const avgRisk = totalWeights > 0 ? totalWeightedRisk / totalWeights : 50;
  const overallPrivacyScore = Math.max(0, Math.min(100, Math.round(100 - avgRisk)));

  const grade =
    overallPrivacyScore >= 90
      ? 'A+'
      : overallPrivacyScore >= 80
      ? 'A'
      : overallPrivacyScore >= 70
      ? 'B'
      : overallPrivacyScore >= 60
      ? 'C'
      : overallPrivacyScore >= 50
      ? 'D'
      : 'F';

  return {
    overallPrivacyScore,
    grade,
    totalAccounts: nodes.length,
    criticalAccountsCount: criticalCount,
    highRiskAccountsCount: highRiskCount,
    spofCount,
    passwordClusterCount: clusterCounts.size,
    reusedPasswordAccountsCount: reusedCount,
    missing2FACount: missing2FA,
    highRiskPermissionsCount: highPermCount,
    totalNetworkRiskScore: Math.round(totalWeightedRisk),
    tierBreakdown: tierBreakdown as Record<GraphNode['riskTier'], number>,
  };
}

export function generatePrioritizedRemediations(
  accounts: Account[],
  currentMetrics: RiskMetrics
): RemediationAction[] {
  const actions: RemediationAction[] = [];

  // Build baseline network state
  const baseNetwork = calculateEffectiveNetworkRisk(buildExposureNetwork(accounts));
  const baseRiskMap = new Map<string, number>();
  baseNetwork.nodes.forEach((n) => baseRiskMap.set(n.id, n.effectiveRisk));
  const baselineGlobalRisk = Math.max(currentMetrics.totalNetworkRiskScore, 1);

  // Counterfactual simulation helper
  const runCounterfactualSimulation = (
    modifiedAccounts: Account[],
    targetAccountId: string
  ) => {
    const simNet = calculateEffectiveNetworkRisk(buildExposureNetwork(modifiedAccounts));
    const simMetrics = computeRiskMetrics(simNet);

    const beforeGlobalRisk = baselineGlobalRisk;
    const afterGlobalRisk = simMetrics.totalNetworkRiskScore;
    const absoluteDelta = Math.max(0, beforeGlobalRisk - afterGlobalRisk);
    const relativePct = Math.min(
      99,
      Math.max(1, Math.round((absoluteDelta / beforeGlobalRisk) * 100))
    );

    // Identify downstream accounts that experienced a risk reduction
    const protectedDownstreamNames: string[] = [];
    simNet.nodes.forEach((sn) => {
      if (sn.id !== targetAccountId) {
        const prevRisk = baseRiskMap.get(sn.id) || 0;
        if (sn.effectiveRisk < prevRisk) {
          protectedDownstreamNames.push(sn.name);
        }
      }
    });

    const targetBaseNode = baseNetwork.nodes.find((n) => n.id === targetAccountId);
    const targetSimNode = simNet.nodes.find((n) => n.id === targetAccountId);

    const beforeBlast = targetBaseNode?.downstreamBlastRadiusCount || 0;
    const afterBlast = targetSimNode?.downstreamBlastRadiusCount || 0;

    // Lateral attack paths severed = outgoing connections plus reachable nodes mitigated
    const severedPaths = Math.max(
      protectedDownstreamNames.length,
      beforeBlast - afterBlast > 0 ? beforeBlast - afterBlast : beforeBlast > 0 ? beforeBlast : 1
    );

    const counterfactual = {
      beforeGlobalRisk,
      afterGlobalRisk,
      beforeScore: currentMetrics.overallPrivacyScore,
      afterScore: simMetrics.overallPrivacyScore,
      beforeSPOFCount: currentMetrics.spofCount,
      afterSPOFCount: simMetrics.spofCount,
      beforeBlastRadius: beforeBlast,
      afterBlastRadius: afterBlast,
    };

    return {
      simMetrics,
      absoluteDelta,
      relativePct,
      protectedDownstreamNames,
      severedPaths,
      counterfactual,
    };
  };

  accounts.forEach((acc) => {
    // 1. Missing 2FA Action (Counterfactual Evaluation)
    if (!acc.has2FA) {
      const cloned = accounts.map((a) =>
        a.id === acc.id
          ? { ...a, has2FA: true, twoFactorType: 'authenticator_app' as const }
          : a
      );
      const sim = runCounterfactualSimulation(cloned, acc.id);
      const scoreDelta = Math.max(1, sim.simMetrics.overallPrivacyScore - currentMetrics.overallPrivacyScore);

      const protectedPreview =
        sim.protectedDownstreamNames.length > 0
          ? sim.protectedDownstreamNames.slice(0, 3).join(', ') +
            (sim.protectedDownstreamNames.length > 3
              ? ` +${sim.protectedDownstreamNames.length - 3} more`
              : '')
          : 'connected services';

      const rationale =
        acc.serviceCategory === 'identity_email'
          ? `Enabling 2FA on ${acc.name} removes ${sim.relativePct}% of total network risk by severing ${sim.severedPaths} lateral takeover paths.`
          : `Enabling 2FA on ${acc.name} eliminates ${sim.relativePct}% of network risk, hardening credential reset routes to ${protectedPreview}.`;

      const roiTier =
        sim.relativePct >= 30 || sim.absoluteDelta >= 250
          ? 'MAX_IMPACT'
          : sim.relativePct >= 15 || sim.absoluteDelta >= 120
          ? 'HIGH_ROI'
          : sim.relativePct >= 5
          ? 'MODERATE'
          : 'TACTICAL';

      actions.push({
        id: `fix_2fa_${acc.id}`,
        accountId: acc.id,
        accountName: acc.name,
        category: 'enable_2fa',
        title: `Enable 2FA on ${acc.name}`,
        description:
          acc.serviceCategory === 'identity_email'
            ? `Critical Single Point of Failure! Securing this email stops credential reset takeovers on ${sim.severedPaths} connected services.`
            : `Add Authenticator App or Security Key 2-Factor Authentication to block direct and transitive takeovers.`,
        impactScore: scoreDelta,
        absoluteRiskReduction: sim.absoluteDelta,
        relativeRiskReductionPercentage: sim.relativePct,
        severedAttackPathsCount: sim.severedPaths,
        severedTargetAccounts: sim.protectedDownstreamNames,
        roiTier,
        difficulty: 'Easy',
        isCompleted: false,
        mathematicalProofRationale: rationale,
        counterfactual: sim.counterfactual,
      });
    }

    // 2. Reused Password Action (Counterfactual Evaluation)
    if (acc.passwordClusterId && !acc.passwordClusterId.includes('unique')) {
      const cloned = accounts.map((a) =>
        a.id === acc.id ? { ...a, passwordClusterId: `cluster_unique_${acc.id}` } : a
      );
      const sim = runCounterfactualSimulation(cloned, acc.id);
      const scoreDelta = Math.max(1, sim.simMetrics.overallPrivacyScore - currentMetrics.overallPrivacyScore);

      const rationale = `Assigning a unique password to ${acc.name} eliminates ${sim.relativePct}% of network risk, severing ${Math.max(1, sim.severedPaths)} credential-stuffing attack vectors.`;

      const roiTier =
        sim.relativePct >= 30 || sim.absoluteDelta >= 250
          ? 'MAX_IMPACT'
          : sim.relativePct >= 15 || sim.absoluteDelta >= 120
          ? 'HIGH_ROI'
          : sim.relativePct >= 5
          ? 'MODERATE'
          : 'TACTICAL';

      actions.push({
        id: `fix_pwd_${acc.id}`,
        accountId: acc.id,
        accountName: acc.name,
        category: 'isolate_password',
        title: `Assign Unique Password to ${acc.name}`,
        description: `Break credential-stuffing bridge. Currently shares a password group with other services.`,
        impactScore: scoreDelta,
        absoluteRiskReduction: sim.absoluteDelta,
        relativeRiskReductionPercentage: sim.relativePct,
        severedAttackPathsCount: Math.max(1, sim.severedPaths),
        severedTargetAccounts: sim.protectedDownstreamNames,
        roiTier,
        difficulty: 'Easy',
        isCompleted: false,
        mathematicalProofRationale: rationale,
        counterfactual: sim.counterfactual,
      });
    }

    // 3. Excessive Permissions Action (Counterfactual Evaluation)
    if (acc.permissions.length >= 3) {
      const cloned = accounts.map((a) =>
        a.id === acc.id ? { ...a, permissions: acc.permissions.slice(0, 1) } : a
      );
      const sim = runCounterfactualSimulation(cloned, acc.id);
      const scoreDelta = Math.max(1, sim.simMetrics.overallPrivacyScore - currentMetrics.overallPrivacyScore);

      const rationale = `Revoking invasive hardware permissions on ${acc.name} reduces marginal application risk by ${sim.relativePct}%.`;

      const roiTier =
        sim.relativePct >= 20 || sim.absoluteDelta >= 100
          ? 'HIGH_ROI'
          : sim.relativePct >= 5
          ? 'MODERATE'
          : 'TACTICAL';

      actions.push({
        id: `fix_perm_${acc.id}`,
        accountId: acc.id,
        accountName: acc.name,
        category: 'revoke_permission',
        title: `Revoke Invasive Permissions from ${acc.name}`,
        description: `Revoke background location, contacts, and microphone permissions from this application.`,
        impactScore: scoreDelta,
        absoluteRiskReduction: sim.absoluteDelta,
        relativeRiskReductionPercentage: sim.relativePct,
        severedAttackPathsCount: 1,
        severedTargetAccounts: [],
        roiTier,
        difficulty: 'Moderate',
        isCompleted: false,
        mathematicalProofRationale: rationale,
        counterfactual: sim.counterfactual,
      });
    }

    // 4. Stale / Decommission Candidates (Counterfactual Evaluation)
    const daysInactive = Math.floor(
      (new Date('2026-10-01').getTime() - new Date(acc.lastActivityDate).getTime()) /
        (1000 * 3600 * 24)
    );
    if (daysInactive > 180 && acc.knownBreachesCount > 0) {
      const cloned = accounts.filter((a) => a.id !== acc.id);
      const sim = runCounterfactualSimulation(cloned, acc.id);
      const scoreDelta = Math.max(1, sim.simMetrics.overallPrivacyScore - currentMetrics.overallPrivacyScore);

      const rationale = `Decommissioning ${acc.name} completely cuts ${sim.relativePct}% of global network risk and destroys ${sim.severedPaths} orphan breach exposure vectors.`;

      const roiTier =
        sim.relativePct >= 20 || sim.absoluteDelta >= 150
          ? 'HIGH_ROI'
          : sim.relativePct >= 5
          ? 'MODERATE'
          : 'TACTICAL';

      actions.push({
        id: `fix_decom_${acc.id}`,
        accountId: acc.id,
        accountName: acc.name,
        category: 'decommission_stale',
        title: `Delete Stale Account: ${acc.name}`,
        description: `Account has been inactive for ${daysInactive} days and has known breach records. Deleting it completely closes this attack surface.`,
        impactScore: scoreDelta,
        absoluteRiskReduction: sim.absoluteDelta,
        relativeRiskReductionPercentage: sim.relativePct,
        severedAttackPathsCount: sim.severedPaths,
        severedTargetAccounts: sim.protectedDownstreamNames,
        roiTier,
        difficulty: 'Advanced',
        isCompleted: false,
        mathematicalProofRationale: rationale,
        counterfactual: sim.counterfactual,
      });
    }
  });

  // Sort strictly by Marginal Risk Reduction (absolute delta risk, then relative risk percentage)
  return actions.sort((a, b) => {
    if (b.absoluteRiskReduction !== a.absoluteRiskReduction) {
      return b.absoluteRiskReduction - a.absoluteRiskReduction;
    }
    return b.relativeRiskReductionPercentage - a.relativeRiskReductionPercentage;
  });
}
