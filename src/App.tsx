import React, { useState, useMemo } from 'react';
import type { Account, PasswordCluster } from './types/account';
import type { RemediationAction } from './types/risk';
import type { LayoutMode } from './services/graphEngine';
import { buildExposureNetwork } from './services/graphEngine';
import { calculateEffectiveNetworkRisk, computeRiskMetrics, generatePrioritizedRemediations } from './services/riskEngine';
import { 
  loadStoredAccounts, 
  saveStoredAccounts, 
  loadStoredClusters, 
  saveStoredClusters, 
  loadCompletedActionIds, 
  saveCompletedActionIds, 
  loadScoreHistory, 
  saveScoreHistory, 
  resetToSeedData,
} from './services/storage';
import type { ScoreHistoryPoint } from './services/storage';

import { DashboardView } from './components/DashboardView';
import { ExposureGraph } from './components/ExposureGraph';
import { InventoryManager } from './components/InventoryManager';
import { FixChecklist } from './components/FixChecklist';
import { BreachSimulatorModal } from './components/BreachSimulatorModal';
import { ReviewReminders } from './components/ReviewReminders';

import { 
  ShieldAlert, 
  Layers, 
  Network, 
  ListChecks, 
  Flame, 
  RotateCcw, 
  Download, 
  Lock
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'graph' | 'inventory' | 'checklist' | 'breach_alerts';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>(() => loadStoredAccounts());
  const [clusters, setClusters] = useState<PasswordCluster[]>(() => loadStoredClusters());
  const [completedActionIds, setCompletedActionIds] = useState<string[]>(() => loadCompletedActionIds());
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryPoint[]>(() => loadScoreHistory());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('concentric');

  // Breach Simulator Modal State
  const [isBreachModalOpen, setIsBreachModalOpen] = useState(false);
  const [breachOriginId, setBreachOriginId] = useState<string | null>(null);

  // 1. Exposure Graph Calculation with active layout mode
  const network = useMemo(() => {
    const rawNetwork = buildExposureNetwork(accounts, layoutMode);
    return calculateEffectiveNetworkRisk(rawNetwork);
  }, [accounts, layoutMode]);

  // 2. Risk Metrics Calculation
  const metrics = useMemo(() => {
    return computeRiskMetrics(network);
  }, [network]);

  // 3. Prioritized Remediation Actions (Marginal Risk Optimization)
  const prioritizedActions = useMemo(() => {
    return generatePrioritizedRemediations(accounts, metrics);
  }, [accounts, metrics]);

  // Persist accounts whenever they change
  const handleUpdateAccounts = (newAccounts: Account[]) => {
    setAccounts(newAccounts);
    saveStoredAccounts(newAccounts);
  };

  const handleUpdateClusters = (newClusters: PasswordCluster[]) => {
    setClusters(newClusters);
    saveStoredClusters(newClusters);
  };

  // Applying a remediation fix
  const handleApplyFix = (action: RemediationAction) => {
    let updatedAccounts = [...accounts];

    if (action.category === 'enable_2fa') {
      updatedAccounts = updatedAccounts.map((a) =>
        a.id === action.accountId
          ? { ...a, has2FA: true, twoFactorType: 'authenticator_app' as const }
          : a
      );
    } else if (action.category === 'isolate_password') {
      updatedAccounts = updatedAccounts.map((a) =>
        a.id === action.accountId
          ? { ...a, passwordClusterId: `cluster_unique_${a.id}` }
          : a
      );
    } else if (action.category === 'revoke_permission') {
      updatedAccounts = updatedAccounts.map((a) =>
        a.id === action.accountId
          ? { ...a, permissions: a.permissions.slice(0, 1) }
          : a
      );
    } else if (action.category === 'decommission_stale') {
      updatedAccounts = updatedAccounts.filter((a) => a.id !== action.accountId);
    }

    handleUpdateAccounts(updatedAccounts);

    const newCompleted = [...completedActionIds, action.id];
    setCompletedActionIds(newCompleted);
    saveCompletedActionIds(newCompleted);

    // Compute updated score and record in history
    const rawNet = buildExposureNetwork(updatedAccounts, layoutMode);
    const solvedNet = calculateEffectiveNetworkRisk(rawNet);
    const newMetrics = computeRiskMetrics(solvedNet);

    const newPoint: ScoreHistoryPoint = {
      date: new Date().toISOString().split('T')[0],
      score: newMetrics.overallPrivacyScore,
      label: `Fixed: ${action.title}`,
    };
    const newHistory = [...scoreHistory, newPoint];
    setScoreHistory(newHistory);
    saveScoreHistory(newHistory);
  };

  const handleResetSampleFootprint = () => {
    if (confirm('Reset your accounts inventory to the realistic default footprint?')) {
      const { accounts: resetAccs, clusters: resetClust } = resetToSeedData();
      setAccounts(resetAccs);
      setClusters(resetClust);
      setCompletedActionIds([]);
      setSelectedNodeId(null);
    }
  };

  const handleExportAuditJson = () => {
    const auditData = {
      exportedAt: new Date().toISOString(),
      privacyScore: metrics.overallPrivacyScore,
      grade: metrics.grade,
      totalAccounts: accounts.length,
      singlePointsOfFailure: network.nodes.filter((n) => n.isSPOF).map((n) => n.name),
      accounts,
      edges: network.edges,
      recommendedFixes: prioritizedActions.slice(0, 5),
    };
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-risk-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenBreachSimulator = (originId?: string) => {
    setBreachOriginId(originId || accounts[0]?.id || null);
    setIsBreachModalOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Application Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Lock size={22} />
          </div>
          <div>
            <h1 className="brand-title">
              Digital Footprint <span style={{ color: 'var(--accent-cyan)' }}>Auditor</span>
              <span className="version-badge">v4.0</span>
            </h1>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="nav-tabs" aria-label="Main Navigation">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <Layers size={16} /> Privacy Dashboard
          </button>
          <button
            id="tab-graph"
            onClick={() => setActiveTab('graph')}
            className={`nav-tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
          >
            <Network size={16} /> Exposure Graph
          </button>
          <button
            id="tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`nav-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          >
            <ListChecks size={16} /> Inventory ({accounts.length})
          </button>
          <button
            id="tab-checklist"
            onClick={() => setActiveTab('checklist')}
            className={`nav-tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
          >
            <ShieldAlert size={16} /> Fix Checklist ({prioritizedActions.filter((a) => !completedActionIds.includes(a.id)).length})
          </button>
          <button
            id="tab-alerts"
            onClick={() => setActiveTab('breach_alerts')}
            className={`nav-tab-btn ${activeTab === 'breach_alerts' ? 'active' : ''}`}
          >
            <Flame size={16} /> Breach & Alerts
          </button>
        </nav>

        {/* Right Header Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => handleOpenBreachSimulator()}
            className="btn-danger btn-sm"
            title="Detonate Simulated Data Breach"
          >
            <Flame size={14} /> Simulate Breach
          </button>
          <button
            onClick={handleExportAuditJson}
            className="btn-secondary btn-sm"
            title="Export JSON Audit Report"
          >
            <Download size={14} /> Export Audit
          </button>
          <button
            onClick={handleResetSampleFootprint}
            className="btn-secondary btn-sm"
            title="Reset to Sample Digital Footprint"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* Main View Port */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            network={network}
            accounts={accounts}
            topActions={prioritizedActions}
            scoreHistory={scoreHistory}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onNavigateToFixes={() => setActiveTab('checklist')}
            onNavigateToInventory={() => setActiveTab('inventory')}
            onOpenBreachSimulator={handleOpenBreachSimulator}
          />
        )}

        {activeTab === 'graph' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>Interactive Exposure & Risk Graph</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Visualizing multi-hop attack vectors: SSO authorization, password recovery inboxes, and shared password clusters.
                </p>
              </div>
              <button onClick={() => handleOpenBreachSimulator(selectedNodeId || undefined)} className="btn-danger btn-sm">
                <Flame size={14} /> Simulate Breach On Selection
              </button>
            </div>

            <ExposureGraph
              network={network}
              selectedNodeId={selectedNodeId}
              layoutMode={layoutMode}
              onLayoutChange={setLayoutMode}
              onSelectNode={setSelectedNodeId}
              onSimulateBreachFromNode={handleOpenBreachSimulator}
            />
          </div>
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            accounts={accounts}
            clusters={clusters}
            network={network}
            onUpdateAccounts={handleUpdateAccounts}
            onUpdateClusters={handleUpdateClusters}
            onSelectNode={setSelectedNodeId}
          />
        )}

        {activeTab === 'checklist' && (
          <FixChecklist
            actions={prioritizedActions}
            completedActionIds={completedActionIds}
            onApplyFix={handleApplyFix}
          />
        )}

        {activeTab === 'breach_alerts' && (
          <ReviewReminders
            accounts={accounts}
            onUpdateAccounts={handleUpdateAccounts}
          />
        )}
      </main>

      {/* Simulated Breach & Blast Radius Modal */}
      <BreachSimulatorModal
        accounts={accounts}
        initialOriginAccountId={breachOriginId}
        isOpen={isBreachModalOpen}
        onClose={() => setIsBreachModalOpen(false)}
      />
    </div>
  );
};

export default App;
