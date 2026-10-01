import type { Account, IdentityTier, AliasProvider } from './account';

export interface ContaminatedBridge {
  id: string;
  sourceAccount: Account;
  targetCrownJewel: Account;
  bridgeType: 'shared_recovery_inbox' | 'shared_password_cluster' | 'sso_transitive_link';
  riskLevel: 'critical' | 'high' | 'moderate';
  pathDescription: string;
  mitigationRecommendation: string;
}

export interface RecommendedAliasDecoupling {
  accountId: string;
  accountName: string;
  currentEmailOrInbox: string;
  currentTier: IdentityTier;
  suggestedAlias: string;
  suggestedProvider: AliasProvider;
  currentContaminatedCrownJewels: string[];
  reachabilityDropPercentage: number;
  rationale: string;
}

export interface DecouplingBlueprint {
  totalCrownJewels: number;
  isolatedCrownJewelsCount: number;
  contaminatedCrownJewelsCount: number;
  totalContaminatedBridges: number;
  transitiveReachabilityPercentage: number; // % of low-trust Tier 3 nodes that can reach a Tier 1 crown jewel
  tier1VaultAccounts: Account[];
  tier2WorkAccounts: Account[];
  tier3DisposableAccounts: Account[];
  bridges: ContaminatedBridge[];
  recommendations: RecommendedAliasDecoupling[];
}
