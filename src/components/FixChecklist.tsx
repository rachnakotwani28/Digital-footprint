import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import type { RemediationAction, RemediationCategory } from '../types/risk';
import { 
  ShieldCheck, 
  Key, 
  Trash2, 
  Sliders, 
  CheckCircle, 
  Zap, 
  Info, 
  X, 
  Shield, 
  TrendingDown, 
  GitFork, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Activity 
} from 'lucide-react';

interface FixChecklistProps {
  actions: RemediationAction[];
  completedActions?: RemediationAction[];
  completedActionIds: string[];
  onApplyFix: (action: RemediationAction) => void;
  onApplyAllQuickWins?: (actions: RemediationAction[]) => void;
}

export const FixChecklist: React.FC<FixChecklistProps> = ({
  actions,
  completedActions = [],
  completedActionIds,
  onApplyFix,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeGuideAction, setActiveGuideAction] = useState<RemediationAction | null>(null);
  const [expandedDiffActionId, setExpandedDiffActionId] = useState<string | null>(null);
  const [showParetoDetails, setShowParetoDetails] = useState<boolean>(true);

  // Active pending actions (excluding any completed ids)
  const pendingActions = actions.filter((a) => !completedActionIds.includes(a.id) && !a.isCompleted);
  
  // Resolved actions list (from history and/or completed actions)
  const resolvedList = completedActions.length > 0 
    ? completedActions 
    : actions.filter((a) => completedActionIds.includes(a.id) || a.isCompleted);

  const completedCount = resolvedList.length;
  const pendingCount = pendingActions.length;
  const totalTasks = pendingCount + completedCount;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : (completedCount > 0 ? 100 : 0);

  const filteredActions = selectedCategory === 'COMPLETED'
    ? resolvedList
    : selectedCategory === 'ALL'
    ? pendingActions
    : pendingActions.filter((action) => action.category === selectedCategory);

  // Top 3 cumulative risk reduction calculation
  const top3Actions = pendingActions.slice(0, 3);
  const top3CumulativeReductionPct = Math.min(
    95,
    top3Actions.reduce((sum, a) => sum + a.relativeRiskReductionPercentage, 0)
  );

  const handleFixClick = (action: RemediationAction) => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.75 },
      colors: ['#06b6d4', '#10b981', '#6366f1', '#ec4899'],
    });
    onApplyFix(action);
  };

  const handleApplyTop3QuickWins = () => {
    const quickWins = pendingActions.slice(0, 3);
    if (quickWins.length === 0) return;

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
    });

    quickWins.forEach((action) => {
      onApplyFix(action);
    });
  };

  const getCategoryIcon = (category: RemediationCategory) => {
    switch (category) {
      case 'enable_2fa':
        return <ShieldCheck size={20} style={{ color: '#10b981' }} />;
      case 'isolate_password':
        return <Key size={20} style={{ color: '#f59e0b' }} />;
      case 'revoke_permission':
        return <Sliders size={20} style={{ color: '#06b6d4' }} />;
      case 'decommission_stale':
        return <Trash2 size={20} style={{ color: '#f43f5e' }} />;
      default:
        return <Zap size={20} style={{ color: '#a855f7' }} />;
    }
  };

  const getRoiBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'MAX_IMPACT':
        return {
          background: 'rgba(244, 63, 94, 0.18)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          color: '#fb7185',
        };
      case 'HIGH_ROI':
        return {
          background: 'rgba(245, 158, 11, 0.18)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          color: '#fbbf24',
        };
      case 'MODERATE':
        return {
          background: 'rgba(6, 182, 212, 0.15)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          color: '#38bdf8',
        };
      default:
        return {
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'var(--text-secondary)',
        };
    }
  };

  const getGuidanceSteps = (action: RemediationAction) => {
    switch (action.category) {
      case 'enable_2fa':
        return [
          `Open ${action.accountName} security settings.`,
          'Turn on Two-Factor Authentication (2FA).',
          'Pair with an Authenticator App (Google Authenticator, Bitwarden, etc.).',
          'Save your backup recovery codes in a safe place.',
        ];
      case 'isolate_password':
        return [
          'Generate a unique password in your password manager.',
          `Update your password in ${action.accountName} settings.`,
          'Ensure this password is not used anywhere else.',
        ];
      case 'revoke_permission':
        return [
          `Go to device settings > Apps > ${action.accountName} > Permissions.`,
          'Revoke unnecessary location, contacts, or microphone permissions.',
        ];
      case 'decommission_stale':
        return [
          `Log in to ${action.accountName} account settings.`,
          'Submit an account and data deletion request.',
        ];
      default:
        return ['Follow the recommended safeguards.'];
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header Card */}
      <div className="glass-panel" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700 }}>
              Prioritized Fix Queue
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Actions ranked mathematically by Marginal Risk Reduction (<strong style={{ color: '#fff' }}>ΔRisk</strong>). Highest ROI fixes appear first.
            </p>
          </div>

          {/* Quick 1-Click Action & Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {pendingActions.length > 0 && (
              <button
                onClick={handleApplyTop3QuickWins}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
                  padding: '9px 16px',
                  fontSize: '0.88rem',
                }}
              >
                <Zap size={16} /> 1-Click Apply Top 3 Fixes
              </button>
            )}

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', minWidth: '190px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: 5 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Completed:</span>
                <strong style={{ color: '#10b981' }}>{completedCount} / {totalTasks} ({completionPercentage}%)</strong>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${completionPercentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #06b6d4, #10b981)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pareto High-ROI Summary Strip */}
        {pendingActions.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                <Activity size={16} style={{ color: '#06b6d4' }} />
                <span>Top 3 fixes eliminate ~{top3CumulativeReductionPct}% of total network risk</span>
              </div>
              <button
                onClick={() => setShowParetoDetails(!showParetoDetails)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {showParetoDetails ? 'Hide' : 'Show Top 3 Breakdown'}
                {showParetoDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showParetoDetails && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 10 }}>
                {pendingActions.slice(0, 3).map((action, idx) => (
                  <div
                    key={action.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>#{idx + 1} {action.accountName}</span>
                      <strong style={{ color: idx === 0 ? '#f43f5e' : '#06b6d4' }}>
                        -{action.relativeRiskReductionPercentage}% ΔRisk
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All Pending (${pendingActions.length})` },
            { id: 'enable_2fa', label: `2FA Upgrades (${pendingActions.filter((a) => a.category === 'enable_2fa').length})` },
            { id: 'isolate_password', label: `Password Decoupling (${pendingActions.filter((a) => a.category === 'isolate_password').length})` },
            { id: 'revoke_permission', label: `Permission Audits (${pendingActions.filter((a) => a.category === 'revoke_permission').length})` },
            { id: 'decommission_stale', label: `Stale Cleanup (${pendingActions.filter((a) => a.category === 'decommission_stale').length})` },
            { id: 'COMPLETED', label: `Resolved (${completedCount})` },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                border: selectedCategory === cat.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                background: selectedCategory === cat.id ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                color: selectedCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.84rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredActions.length === 0 ? (
          <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CheckCircle size={32} style={{ color: '#10b981', margin: '0 auto 10px' }} />
            <h3 style={{ fontSize: '1.05rem', color: '#fff' }}>No Actions in this Category</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {selectedCategory === 'COMPLETED' 
                ? 'No resolved fixes recorded yet. Apply fixes from the queue to track them here.'
                : 'All recommendations in this filter have been resolved.'}
            </p>
          </div>
        ) : (
          filteredActions.map((action, index) => {
            const isCompleted = completedActionIds.includes(action.id) || action.isCompleted;
            const isDiffExpanded = expandedDiffActionId === action.id;

            return (
              <div
                key={action.id}
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  opacity: isCompleted ? 0.6 : 1,
                  borderLeft: `4px solid ${
                    isCompleted
                      ? '#10b981'
                      : action.roiTier === 'MAX_IMPACT'
                      ? '#f43f5e'
                      : action.roiTier === 'HIGH_ROI'
                      ? '#f59e0b'
                      : 'var(--accent-cyan)'
                  }`,
                }}
              >
                {/* Main Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'nowrap', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {getCategoryIcon(action.category)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: isCompleted ? 'var(--text-muted)' : '#f8fafc' }}>
                          {action.title}
                        </h4>

                        <span
                          className="badge"
                          style={{
                            ...getRoiBadgeStyle(action.roiTier),
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <TrendingDown size={13} />
                          ΔRisk: -{action.relativeRiskReductionPercentage}%
                        </span>

                        <span className="badge badge-cyan" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                          <GitFork size={12} />
                          {action.severedAttackPathsCount} Paths Severed
                        </span>
                      </div>

                      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        {action.description}
                      </div>
                    </div>
                  </div>

                  {/* Right Button Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
                    <button
                      onClick={() => setExpandedDiffActionId(isDiffExpanded ? null : action.id)}
                      className="btn-secondary btn-sm"
                      title="Inspect Before vs After metrics"
                      style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    >
                      {isDiffExpanded ? 'Hide Diff' : 'Counterfactual Diff'}
                    </button>

                    <button
                      onClick={() => setActiveGuideAction(action)}
                      className="btn-secondary btn-sm"
                      title="View Step-by-Step Fix Guidance"
                      style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    >
                      <Info size={14} /> Guide
                    </button>

                    {isCompleted ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <Check size={16} /> Resolved
                      </span>
                    ) : (
                      <button
                        onClick={() => handleFixClick(action)}
                        className="btn-primary btn-sm"
                        style={{
                          whiteSpace: 'nowrap',
                          fontSize: '0.82rem',
                          background: index === 0 ? 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)' : undefined,
                        }}
                      >
                        <Zap size={14} /> Apply Fix Now
                      </button>
                    )}
                  </div>
                </div>

                {/* Counterfactual Diff Drawer */}
                {isDiffExpanded && action.counterfactual && (
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      marginTop: 4,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Network Risk Units</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                        <span style={{ color: '#f43f5e' }}>{action.counterfactual.beforeGlobalRisk}</span> ➔ <span style={{ color: '#10b981' }}>{action.counterfactual.afterGlobalRisk}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Privacy Score</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                        <span style={{ color: '#94a3b8' }}>{action.counterfactual.beforeScore}</span> ➔ <span style={{ color: '#10b981' }}>+{action.counterfactual.afterScore - action.counterfactual.beforeScore} pts</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SPOFs</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                        <span style={{ color: '#f43f5e' }}>{action.counterfactual.beforeSPOFCount}</span> ➔ <span style={{ color: '#10b981' }}>{action.counterfactual.afterSPOFCount}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Blast Radius</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                        <span style={{ color: '#f59e0b' }}>{action.counterfactual.beforeBlastRadius} targets</span> ➔ <span style={{ color: '#10b981' }}>{action.counterfactual.afterBlastRadius}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Step-by-Step Guidance Modal */}
      {activeGuideAction && (
        <div className="modal-overlay" onClick={() => setActiveGuideAction(null)}>
          <div className="modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} style={{ color: 'var(--accent-cyan)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{activeGuideAction.title}</h3>
              </div>
              <button
                onClick={() => setActiveGuideAction(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 12 }}>
                Impact: -{activeGuideAction.relativeRiskReductionPercentage}% Network Risk ({activeGuideAction.severedAttackPathsCount} paths severed)
              </div>

              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 8, color: '#f8fafc' }}>
                Execution Steps:
              </div>

              <ol style={{ paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8, lineHeight: 1.4 }}>
                {getGuidanceSteps(activeGuideAction).map((step, idx) => (
                  <li key={idx}>
                    {step}
                  </li>
                ))}
              </ol>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <button onClick={() => setActiveGuideAction(null)} className="btn-secondary btn-sm">
                  Close
                </button>
                {!completedActionIds.includes(activeGuideAction.id) && (
                  <button
                    onClick={() => {
                      handleFixClick(activeGuideAction);
                      setActiveGuideAction(null);
                    }}
                    className="btn-primary btn-sm"
                  >
                    <Zap size={14} /> Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

