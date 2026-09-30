import type { Account } from '../types/account';
import type { BreachSimulationResult, CascadeStep } from '../types/risk';

export function simulateBreach(originAccountId: string, accounts: Account[]): BreachSimulationResult {
  const accountMap = new Map<string, Account>();
  accounts.forEach((a) => accountMap.set(a.id, a));

  const origin = accountMap.get(originAccountId);
  if (!origin) {
    throw new Error(`Account ${originAccountId} not found.`);
  }

  const compromisedSet = new Set<string>();
  compromisedSet.add(originAccountId);

  const directlyCompromised: string[] = [];
  const indirectlyCompromised: string[] = [];
  const cascadeSteps: CascadeStep[] = [];

  let currentBatch = [originAccountId];
  let stepCounter = 1;

  while (currentBatch.length > 0) {
    const nextBatch: string[] = [];

    for (const currentId of currentBatch) {
      const currentAcc = accountMap.get(currentId)!;

      // 1. Password reuse attack vector
      if (currentAcc.passwordClusterId && !currentAcc.passwordClusterId.includes('unique')) {
        accounts.forEach((other) => {
          if (
            other.id !== currentId &&
            other.passwordClusterId === currentAcc.passwordClusterId &&
            !compromisedSet.has(other.id)
          ) {
            compromisedSet.add(other.id);
            nextBatch.push(other.id);

            const isDirect = currentId === originAccountId;
            if (isDirect) directlyCompromised.push(other.id);
            else indirectlyCompromised.push(other.id);

            cascadeSteps.push({
              step: stepCounter++,
              sourceAccountId: currentId,
              sourceAccountName: currentAcc.name,
              targetAccountId: other.id,
              targetAccountName: other.name,
              vector: 'Credential Stuffing (Shared Password)',
              rationale: `Breached credentials from ${currentAcc.name} were used to successfully authenticate into ${other.name} because both share the password cluster "${currentAcc.passwordClusterId}".`,
            });
          }
        });
      }

      // 2. SSO Authentication Provider attack vector
      accounts.forEach((child) => {
        if (child.ssoParentId === currentId && !compromisedSet.has(child.id)) {
          compromisedSet.add(child.id);
          nextBatch.push(child.id);

          const isDirect = currentId === originAccountId;
          if (isDirect) directlyCompromised.push(child.id);
          else indirectlyCompromised.push(child.id);

          cascadeSteps.push({
            step: stepCounter++,
            sourceAccountId: currentId,
            sourceAccountName: currentAcc.name,
            targetAccountId: child.id,
            targetAccountName: child.name,
            vector: 'SSO Identity Hijack',
            rationale: `Attacker logged straight into ${child.name} via delegated "Sign in with ${currentAcc.name}" token without needing a separate password.`,
          });
        }
      });

      // 3. Recovery Email mechanism attack vector
      accounts.forEach((target) => {
        if (target.recoveryEmailAccountId === currentId && !compromisedSet.has(target.id)) {
          const canTakeover = target.twoFactorType !== 'hardware_key';
          if (canTakeover) {
            compromisedSet.add(target.id);
            nextBatch.push(target.id);

            const isDirect = currentId === originAccountId;
            if (isDirect) directlyCompromised.push(target.id);
            else indirectlyCompromised.push(target.id);

            cascadeSteps.push({
              step: stepCounter++,
              sourceAccountId: currentId,
              sourceAccountName: currentAcc.name,
              targetAccountId: target.id,
              targetAccountName: target.name,
              vector: 'Account Recovery Password Reset',
              rationale: `Attacker sent a password reset request from ${target.name} and intercepted the reset confirmation email inside the compromised ${currentAcc.name} inbox.`,
            });
          }
        }
      });
    }

    currentBatch = nextBatch;
  }

  const criticalAssetsBreached = Array.from(compromisedSet)
    .filter((id) => id !== originAccountId)
    .map((id) => accountMap.get(id)!)
    .filter((acc) => acc && acc.sensitivityWeight >= 7);

  return {
    originAccountId,
    originAccountName: origin.name,
    directlyCompromisedIds: directlyCompromised,
    indirectlyCompromisedIds: indirectlyCompromised,
    totalAffectedAccounts: compromisedSet.size,
    cascadeSteps,
    overallRiskJump: compromisedSet.size * 12,
    criticalAssetsBreached,
  };
}
