import type { Account } from './account';
import type { RiskTier } from './graph';

export interface RiskMetrics {
  overallPrivacyScore: number; // 0 to 100 (100 = pristine, 0 = catastrophic exposure)
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  totalAccounts: number;
  criticalAccountsCount: number;
  highRiskAccountsCount: number;
  spofCount: number; // Number of Single Points of Failure
  passwordClusterCount: number;
  reusedPasswordAccountsCount: number;
  missing2FACount: number;
  highRiskPermissionsCount: number;
  totalNetworkRiskScore: number; // Aggregate raw sum of effective risks across graph
  tierBreakdown: Record<RiskTier, number>;
}

export type RemediationCategory =
  | 'enable_2fa'
  | 'isolate_password'
  | 'decouple_recovery'
  | 'revoke_permission'
  | 'decommission_stale';

export type ROITier = 'MAX_IMPACT' | 'HIGH_ROI' | 'MODERATE' | 'TACTICAL';

export interface CounterfactualComparison {
  beforeGlobalRisk: number;
  afterGlobalRisk: number;
  beforeScore: number;
  afterScore: number;
  beforeSPOFCount: number;
  afterSPOFCount: number;
  beforeBlastRadius: number;
  afterBlastRadius: number;
}

export interface RemediationAction {
  id: string;
  accountId: string;
  accountName: string;
  category: RemediationCategory;
  title: string;
  description: string;
  impactScore: number; // Marginal Risk Delta points removed from global privacy score (0-100)
  absoluteRiskReduction: number; // Exact drop in aggregate network risk sum
  relativeRiskReductionPercentage: number; // % of total global network risk removed (e.g. 48%)
  severedAttackPathsCount: number; // Number of lateral takeover vectors broken
  severedTargetAccounts: string[]; // Names of downstream accounts protected by this fix
  roiTier: ROITier;
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  isCompleted: boolean;
  mathematicalProofRationale: string;
  counterfactual: CounterfactualComparison;
  actionPayload?: {
    permissionToRevoke?: string;
    suggestedNewCluster?: string;
  };
}

export interface CascadeStep {
  step: number;
  sourceAccountId: string;
  sourceAccountName: string;
  targetAccountId: string;
  targetAccountName: string;
  vector: string;
  rationale: string;
}

export interface BreachSimulationResult {
  originAccountId: string;
  originAccountName: string;
  directlyCompromisedIds: string[];
  indirectlyCompromisedIds: string[];
  totalAffectedAccounts: number;
  cascadeSteps: CascadeStep[];
  overallRiskJump: number;
  criticalAssetsBreached: Account[];
}
