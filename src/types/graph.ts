import type { Account, ServiceCategory } from './account';

export type RelationType =
  | 'SSO_AUTH' // Direct authentication delegation (e.g. Log in with Google)
  | 'RECOVERY_CHANNEL' // Password reset vector (e.g. Reset via Primary Gmail)
  | 'PASSWORD_REUSE'; // Shared credential blast radius

export type RiskTier = 'critical' | 'high' | 'moderate' | 'low';

export interface GraphNode {
  id: string;
  name: string;
  category: ServiceCategory;
  baseRisk: number; // 0 to 100
  effectiveRisk: number; // 0 to 100 (after transitive cascade)
  riskTier: RiskTier;
  isSPOF: boolean; // Single Point of Failure
  downstreamBlastRadiusCount: number; // How many accounts fall if this one is compromised
  upstreamExposureCount: number; // How many accounts can compromise this one
  account: Account;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string; // origin account id
  target: string; // dependent account id
  relationType: RelationType;
  weight: number; // transmission coefficient (e.g. 0.9 for SSO, 0.8 for Recovery, 0.7 for Pwd Reuse)
  label: string;
}

export interface ExposureNetwork {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
