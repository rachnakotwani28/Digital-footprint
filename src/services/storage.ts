import type { Account, PasswordCluster } from '../types/account';
import { INITIAL_ACCOUNTS, INITIAL_PASSWORD_CLUSTERS } from './seedData';

const ACCOUNTS_STORAGE_KEY = 'auditor4_accounts_v1';
const CLUSTERS_STORAGE_KEY = 'auditor4_clusters_v1';
const HISTORY_STORAGE_KEY = 'auditor4_history_v1';
const COMPLETED_ACTIONS_KEY = 'auditor4_completed_actions_v1';

export interface ScoreHistoryPoint {
  date: string;
  score: number;
  label?: string;
}

export function loadStoredAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load accounts from storage, using seed data:', e);
  }
  saveStoredAccounts(INITIAL_ACCOUNTS);
  return INITIAL_ACCOUNTS;
}

export function saveStoredAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts to storage:', e);
  }
}

export function loadStoredClusters(): PasswordCluster[] {
  try {
    const raw = localStorage.getItem(CLUSTERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load clusters from storage:', e);
  }
  saveStoredClusters(INITIAL_PASSWORD_CLUSTERS);
  return INITIAL_PASSWORD_CLUSTERS;
}

export function saveStoredClusters(clusters: PasswordCluster[]): void {
  try {
    localStorage.setItem(CLUSTERS_STORAGE_KEY, JSON.stringify(clusters));
  } catch (e) {
    console.error('Failed to save clusters to storage:', e);
  }
}

export function loadCompletedActionIds(): string[] {
  try {
    const raw = localStorage.getItem(COMPLETED_ACTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCompletedActionIds(ids: string[]): void {
  try {
    localStorage.setItem(COMPLETED_ACTIONS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save completed action ids:', e);
  }
}

export function loadScoreHistory(): ScoreHistoryPoint[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }

  // Initial progression baseline
  const baseline: ScoreHistoryPoint[] = [
    { date: '2026-09-01', score: 38, label: 'Initial Footprint Scan' },
    { date: '2026-09-15', score: 44, label: 'Decommissioned Old Inactive App' },
    { date: '2026-09-25', score: 51, label: 'Separated Banking Password' },
  ];
  saveScoreHistory(baseline);
  return baseline;
}

export function saveScoreHistory(history: ScoreHistoryPoint[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save score history:', e);
  }
}

export function resetToSeedData(): { accounts: Account[]; clusters: PasswordCluster[] } {
  saveStoredAccounts(INITIAL_ACCOUNTS);
  saveStoredClusters(INITIAL_PASSWORD_CLUSTERS);
  saveCompletedActionIds([]);
  return { accounts: INITIAL_ACCOUNTS, clusters: INITIAL_PASSWORD_CLUSTERS };
}
