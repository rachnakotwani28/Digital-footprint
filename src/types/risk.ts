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
  tierBreakdown: Record<RiskTier, number>;
}

export type RemediationCategory =
  | 'enable_2fa'
  | 'isolate_password'
  | 'decouple_recovery'
  | 'revoke_permission'
  | 'decommission_stale';

export interface RemediationAction {
  id: string;
  accountId: string;
  accountName: string;
  category: RemediationCategory;
  title: string;
  description: string;
  impactScore: number; // Marginal Risk Delta (Points removed from global risk)
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  isCompleted: boolean;
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
