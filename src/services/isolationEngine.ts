import type { Account, IdentityTier, AliasProvider } from '../types/account';
import type { 
  DecouplingBlueprint, 
  ContaminatedBridge, 
  RecommendedAliasDecoupling 
} from '../types/isolation';

export function getAccountTier(account: Account): IdentityTier {
  if (account.identityTier) {
    return account.identityTier;
  }
  if (account.sensitivityWeight >= 9 || account.serviceCategory === 'financial') {
    return 'tier1_vault';
  }
  if (
    account.serviceCategory === 'identity_email' ||
    account.serviceCategory === 'work_dev' ||
    account.serviceCategory === 'cloud_storage'
  ) {
    return 'tier2_work';
  }
  return 'tier3_disposable';
}

export function generateMaskedAlias(accountName: string, provider: AliasProvider): string {
  const cleanName = accountName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
  const randomSuffix = Math.random().toString(36).substring(2, 7);

  switch (provider) {
    case 'icloud_relay':
      return `${cleanName}.${randomSuffix}@privaterelay.appleid.com`;
    case 'simplelogin':
      return `${cleanName}-${randomSuffix}@simplelogin.com`;
    case 'duckduckgo':
      return `${cleanName}_${randomSuffix}@duck.com`;
    case 'proton_alias':
      return `${cleanName}.${randomSuffix}@passmail.net`;
    default:
      return `${cleanName}.${randomSuffix}@burner-alias.sec`;
  }
}

export function analyzeCrownJewelDecoupling(accounts: Account[]): DecouplingBlueprint {
  const tier1VaultAccounts: Account[] = [];
  const tier2WorkAccounts: Account[] = [];
  const tier3DisposableAccounts: Account[] = [];

  accounts.forEach((acc) => {
    const tier = getAccountTier(acc);
    if (tier === 'tier1_vault') tier1VaultAccounts.push(acc);
    else if (tier === 'tier2_work') tier2WorkAccounts.push(acc);
    else tier3DisposableAccounts.push(acc);
  });

  const bridges: ContaminatedBridge[] = [];
  const contaminatedCrownJewelIds = new Set<string>();

  // Map password cluster to accounts
  const clusterMap = new Map<string, Account[]>();
  accounts.forEach((acc) => {
    if (acc.passwordClusterId && !acc.passwordClusterId.includes('unique')) {
      const list = clusterMap.get(acc.passwordClusterId) || [];
      list.push(acc);
      clusterMap.set(acc.passwordClusterId, list);
    }
  });

  // Map recovery emails
  const recoveryMap = new Map<string, Account[]>();
  accounts.forEach((acc) => {
    if (acc.recoveryEmailAccountId) {
      const list = recoveryMap.get(acc.recoveryEmailAccountId) || [];
      list.push(acc);
      recoveryMap.set(acc.recoveryEmailAccountId, list);
    }
  });

  // 1. Check for Shared Recovery Inbox Contamination (Tier 3 -> Tier 1)
  tier3DisposableAccounts.forEach((tier3Acc) => {
    if (tier3Acc.isMaskedAlias) return; // Already decoupled with alias!

    tier1VaultAccounts.forEach((tier1Acc) => {
      // Direct recovery shared inbox contamination
      if (
        tier3Acc.recoveryEmailAccountId &&
        tier1Acc.recoveryEmailAccountId &&
        tier3Acc.recoveryEmailAccountId === tier1Acc.recoveryEmailAccountId
      ) {
        contaminatedCrownJewelIds.add(tier1Acc.id);
        bridges.push({
          id: `bridge_rec_${tier3Acc.id}_${tier1Acc.id}`,
          sourceAccount: tier3Acc,
          targetCrownJewel: tier1Acc,
          bridgeType: 'shared_recovery_inbox',
          riskLevel: tier3Acc.knownBreachesCount > 0 ? 'critical' : 'high',
          pathDescription: `${tier3Acc.name} (Tier 3) shares the exact same recovery inbox (${tier3Acc.recoveryEmailAccountId}) as Crown Jewel ${tier1Acc.name}.`,
          mitigationRecommendation: `Decouple ${tier3Acc.name} with a masked burner alias (SimpleLogin / iCloud Hide My Email).`,
        });
      }

      // Shared password cluster contamination
      if (
        tier3Acc.passwordClusterId &&
        tier1Acc.passwordClusterId &&
        tier3Acc.passwordClusterId === tier1Acc.passwordClusterId &&
        !tier3Acc.passwordClusterId.includes('unique')
      ) {
        contaminatedCrownJewelIds.add(tier1Acc.id);
        bridges.push({
          id: `bridge_pwd_${tier3Acc.id}_${tier1Acc.id}`,
          sourceAccount: tier3Acc,
          targetCrownJewel: tier1Acc,
          bridgeType: 'shared_password_cluster',
          riskLevel: 'critical',
          pathDescription: `${tier3Acc.name} shares a password cluster with Crown Jewel ${tier1Acc.name}. A leak in ${tier3Acc.name} allows direct takeover of ${tier1Acc.name}.`,
          mitigationRecommendation: `Isolate ${tier1Acc.name} into a unique vault-generated password and decouple ${tier3Acc.name}.`,
        });
      }
    });

    // Check SSO links to primary hub
    if (tier3Acc.signInMethod === 'google_sso' || tier3Acc.signInMethod === 'apple_sso') {
      const parentHub = accounts.find((a) => a.id === tier3Acc.ssoParentId);
      if (parentHub) {
        tier1VaultAccounts.forEach((tier1Acc) => {
          if (tier1Acc.recoveryEmailAccountId === parentHub.id) {
            contaminatedCrownJewelIds.add(tier1Acc.id);
            bridges.push({
              id: `bridge_sso_${tier3Acc.id}_${tier1Acc.id}`,
              sourceAccount: tier3Acc,
              targetCrownJewel: tier1Acc,
              bridgeType: 'sso_transitive_link',
              riskLevel: 'moderate',
              pathDescription: `${tier3Acc.name} is OAuth-linked to ${parentHub.name}, which acts as the recovery master for ${tier1Acc.name}.`,
              mitigationRecommendation: `Switch ${tier3Acc.name} from SSO sign-in to an isolated masked burner alias login.`,
            });
          }
        });
      }
    }
  });

  // Calculate transitive reachability %
  const totalTier3 = Math.max(tier3DisposableAccounts.length, 1);
  const tier3WithBridges = new Set(bridges.map((b) => b.sourceAccount.id)).size;
  const transitiveReachabilityPercentage = Math.round((tier3WithBridges / totalTier3) * 100);

  // Generate actionable Decoupling Recommendations
  const recommendations: RecommendedAliasDecoupling[] = [];
  tier3DisposableAccounts.forEach((tier3Acc) => {
    if (tier3Acc.isMaskedAlias) return;

    const connectedBridges = bridges.filter((b) => b.sourceAccount.id === tier3Acc.id);
    if (connectedBridges.length > 0) {
      const contaminatedJewels = Array.from(
        new Set(connectedBridges.map((b) => b.targetCrownJewel.name))
      );
      const suggestedProvider: AliasProvider =
        tier3Acc.serviceCategory === 'entertainment_gaming'
          ? 'simplelogin'
          : tier3Acc.serviceCategory === 'shopping'
          ? 'icloud_relay'
          : 'duckduckgo';

      const suggestedAlias = generateMaskedAlias(tier3Acc.name, suggestedProvider);
      const reachabilityDrop = Math.round((1 / totalTier3) * 100);

      recommendations.push({
        accountId: tier3Acc.id,
        accountName: tier3Acc.name,
        currentEmailOrInbox: tier3Acc.usernameOrEmail,
        currentTier: 'tier3_disposable',
        suggestedAlias,
        suggestedProvider,
        currentContaminatedCrownJewels: contaminatedJewels,
        reachabilityDropPercentage: Math.max(reachabilityDrop, 15),
        rationale: `Decoupling ${tier3Acc.name} with a ${suggestedProvider} alias severs ${connectedBridges.length} attack vectors into ${contaminatedJewels.join(', ')}.`,
      });
    }
  });

  return {
    totalCrownJewels: tier1VaultAccounts.length,
    isolatedCrownJewelsCount: tier1VaultAccounts.length - contaminatedCrownJewelIds.size,
    contaminatedCrownJewelsCount: contaminatedCrownJewelIds.size,
    totalContaminatedBridges: bridges.length,
    transitiveReachabilityPercentage,
    tier1VaultAccounts,
    tier2WorkAccounts,
    tier3DisposableAccounts,
    bridges,
    recommendations,
  };
}

export function applyAliasDecoupling(
  accounts: Account[],
  targetAccountId: string,
  provider: AliasProvider,
  customAlias?: string
): Account[] {
  return accounts.map((acc) => {
    if (acc.id === targetAccountId) {
      const aliasEmail = customAlias || generateMaskedAlias(acc.name, provider);
      return {
        ...acc,
        usernameOrEmail: aliasEmail,
        signInMethod: 'direct',
        ssoParentId: undefined,
        recoveryEmailAccountId: undefined, // Fully decoupled from primary email hub!
        isMaskedAlias: true,
        aliasProvider: provider,
        passwordClusterId: `cluster_unique_${acc.id}`, // Automatically assigned unique isolated password
        notes: `${acc.notes ? acc.notes + ' ' : ''}[Decoupled with ${provider} alias: ${aliasEmail}]`,
      };
    }
    return acc;
  });
}
