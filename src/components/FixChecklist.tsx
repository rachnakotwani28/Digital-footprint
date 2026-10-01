import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import type { RemediationAction, RemediationCategory } from '../types/risk';
import { 
  ShieldCheck, 
  Key, 
  Trash2, 
  Sliders, 
  CheckCircle, 
  Sparkles, 
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
  completedActionIds: string[];
  onApplyFix: (action: RemediationAction) => void;
  onApplyAllQuickWins?: (actions: RemediationAction[]) => void;
}

export const FixChecklist: React.FC<FixChecklistProps> = ({
  actions,
  completedActionIds,
  onApplyFix,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeGuideAction, setActiveGuideAction] = useState<RemediationAction | null>(null);
  const [expandedDiffActionId, setExpandedDiffActionId] = useState<string | null>(null);
  const [showParetoDetails, setShowParetoDetails] = useState<boolean>(true);

  const pendingActions = actions.filter((a) => !completedActionIds.includes(a.id));
  const completedActions = actions.filter((a) => completedActionIds.includes(a.id));

  const filteredActions = actions.filter((action) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'COMPLETED') return completedActionIds.includes(action.id);
    return action.category === selectedCategory && !completedActionIds.includes(action.id);
  });

  const totalActions = actions.length;
  const completedCount = completedActions.length;
  const completionPercentage = totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 100;

  // Top 3 cumulative risk reduction calculation
  const top3Actions = pendingActions.slice(0, 3);
  const top3CumulativeReductionPct = Math.min(
    95,
    top3Actions.reduce((sum, a) => sum + a.relativeRiskReductionPercentage, 0)
  );

  const totalSeveredVectors = pendingActions.reduce(
    (sum, a) => sum + (a.severedAttackPathsCount || 1),
    0
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
        return <ShieldCheck size={18} style={{ color: '#10b981' }} />;
      case 'isolate_password':
        return <Key size={18} style={{ color: '#f59e0b' }} />;
      case 'revoke_permission':
        return <Sliders size={18} style={{ color: '#06b6d4' }} />;
      case 'decommission_stale':
        return <Trash2 size={18} style={{ color: '#f43f5e' }} />;
      default:
        return <Zap size={18} style={{ color: '#a855f7' }} />;
    }
  };

  const getRoiBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'MAX_IMPACT':
        return {
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(236, 72, 153, 0.15) 100%)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          color: '#fb7185',
        };
      case 'HIGH_ROI':
        return {
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
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
          `Log in to your ${action.accountName} security dashboard.`,
          'Navigate to "Security" or "Sign-in & Recovery Options".',
          'Locate "2-Step Verification" / "Two-Factor Authentication".',
          'Select "Authenticator App" (e.g. Google Authenticator, Bitwarden, or 1Password) or a Hardware Security Key (YubiKey).',
          'Scan the QR code and verify the 6-digit one-time confirmation token.',
          'Save backup recovery codes in a secure, isolated vault.',
        ];
      case 'isolate_password':
        return [
          `Open your password manager and generate a high-entropy, unique 20+ character random password.`,
          `Log in to ${action.accountName} and navigate to "Account Settings" > "Change Password".`,
          'Replace the shared password with your newly generated isolated password.',
          'Verify that no other service shares this credential.',
        ];
      case 'revoke_permission':
        return [
          `Open your device Settings (or cloud OAuth authorizations for ${action.accountName}).`,
          `Navigate to "Apps" > "${action.accountName}" > "Permissions".`,
          'Revoke background location access, address book contacts, and microphone permissions.',
          'Set location permission to "Only While Using App" or "Never".',
        ];
      case 'decommission_stale':
        return [
          `Log in to ${action.accountName} and navigate to "Privacy / Account Management".`,
          'Submit a formal GDPR / CCPA right-to-be-forgotten deletion and wipe request.',
          'Revoke all associated OAuth tokens and delete stored credit cards or billing profiles.',
        ];
      default:
        return ['Follow the security recommendations to mitigate exposure.'];
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero Header: Marginal Risk Reduction (ΔRisk) Engine */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={13} /> USP 2: Marginal Risk Reduction (ΔRisk) Ranking
              </span>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Counterfactual Simulation Engine
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700 }}>
              Prioritized Remediation Queue (Max ROI First)
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
              Instead of 50+ unranked alerts, fixes are mathematically ordered by their exact marginal risk delta (<strong style={{ color: '#fff' }}>ΔRisk</strong>). We simulate graph cut outcomes to measure how many lateral takeover paths are severed before recommending any action.
            </p>
          </div>

          {/* 1-Click Multi-Fix CTA & Progress Tracker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: '260px' }}>
            {pendingActions.length > 0 && (
              <button
                onClick={handleApplyTop3QuickWins}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
                  padding: '10px 18px',
                }}
              >
                <Zap size={16} /> 1-Click Apply Top 3 High-ROI Fixes
              </button>
            )}

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Footprint Remediation:</span>
                <strong style={{ color: '#10b981' }}>{completionPercentage}% Done</strong>
              </div>
              <div style={{ width: '100%', height: '7px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${completionPercentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #06b6d4, #10b981)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>{completedCount} of {totalActions} fixes resolved</span>
                <span style={{ color: '#38bdf8' }}>{totalSeveredVectors} takeover paths total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pareto Frontier / Diminishing Returns Visualizer */}
        {pendingActions.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} style={{ color: '#06b6d4' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  Pareto Efficiency Frontier: Top 3 Fixes Eliminate ~{top3CumulativeReductionPct}% of Total Network Risk
                </span>
              </div>
              <button
                onClick={() => setShowParetoDetails(!showParetoDetails)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {showParetoDetails ? 'Hide Curve' : 'Show Curve'}
                {showParetoDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showParetoDetails && (
              <div
                style={{
                  background: 'rgba(6, 182, 212, 0.04)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                {pendingActions.slice(0, 4).map((action, idx) => (
                  <div
                    key={action.id}
                    style={{
                      background: idx === 0 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      border: idx === 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Rank #{idx + 1} Fix</span>
                      <span style={{ fontWeight: 700, color: idx === 0 ? '#f43f5e' : '#06b6d4' }}>
                        -{action.relativeRiskReductionPercentage}% ΔRisk
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fff', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {action.accountName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      Severes {action.severedAttackPathsCount} lateral attack paths
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All Pending (${pendingActions.length})` },
            { id: 'enable_2fa', label: '2FA Upgrades' },
            { id: 'isolate_password', label: 'Password Decoupling' },
            { id: 'revoke_permission', label: 'Permission Audits' },
            { id: 'decommission_stale', label: 'Stale Account Cleanup' },
            { id: 'COMPLETED', label: `Resolved (${completedCount})` },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: selectedCategory === cat.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                background: selectedCategory === cat.id ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                color: selectedCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Cards Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredActions.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CheckCircle size={36} style={{ color: '#10b981', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>No Pending Actions in this Category</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
              All recommendations in this filter have been executed. Your attack graph is thoroughly hardened!
            </p>
          </div>
        ) : (
          filteredActions.map((action, index) => {
            const isCompleted = completedActionIds.includes(action.id);
            const isDiffExpanded = expandedDiffActionId === action.id;

            return (
              <div
                key={action.id}
                className="glass-panel"
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  opacity: isCompleted ? 0.6 : 1,
                  borderLeft: `5px solid ${
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
                {/* Main Action Row - Fixed Non-wrapping Right-aligned Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'nowrap', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
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
                        <h4 style={{ fontSize: '1.02rem', fontWeight: 600, color: isCompleted ? 'var(--text-muted)' : '#f8fafc' }}>
                          {action.title}
                        </h4>

                        {/* Marginal Risk Reduction Highlight Badges */}
                        <span
                          className="badge"
                          style={{
                            ...getRoiBadgeStyle(action.roiTier),
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <TrendingDown size={13} />
                          ΔRisk: -{action.relativeRiskReductionPercentage}% (-{action.absoluteRiskReduction} units)
                        </span>

                        <span className="badge badge-cyan" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                          <GitFork size={12} />
                          {action.severedAttackPathsCount} Paths Severed
                        </span>
                      </div>

                      {/* Prominent Mathematical Rationale Banner */}
                      <div
                        style={{
                          background: 'rgba(6, 182, 212, 0.06)',
                          borderLeft: '3px solid var(--accent-cyan)',
                          padding: '8px 12px',
                          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                          marginTop: 8,
                          fontSize: '0.83rem',
                          color: '#e2e8f0',
                          fontStyle: 'italic',
                          wordBreak: 'break-word',
                        }}
                      >
                        "{action.mathematicalProofRationale}"
                      </div>

                      {/* Protected Downstream Targets Preview */}
                      {action.severedTargetAccounts && action.severedTargetAccounts.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Directly protects:</span>
                          {action.severedTargetAccounts.map((tgt) => (
                            <span
                              key={tgt}
                              style={{
                                fontSize: '0.7rem',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '1px 7px',
                                borderRadius: 'var(--radius-full)',
                                color: '#94a3b8',
                              }}
                            >
                              {tgt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Action Controls - Guaranteed Right Alignment */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
                    <button
                      onClick={() => setExpandedDiffActionId(isDiffExpanded ? null : action.id)}
                      className="btn-secondary btn-sm"
                      title="Inspect Counterfactual Before vs After Diff"
                      style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                    >
                      {isDiffExpanded ? 'Hide Simulation' : 'Counterfactual Diff'}
                    </button>

                    <button
                      onClick={() => setActiveGuideAction(action)}
                      className="btn-secondary btn-sm"
                      title="View Step-by-Step Fix Guidance"
                      style={{ whiteSpace: 'nowrap' }}
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
                          background: index === 0 ? 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)' : undefined,
                        }}
                      >
                        <Zap size={14} /> Apply Fix Now
                      </button>
                    )}
                  </div>
                </div>

                {/* Counterfactual Diff Accordion */}
                {isDiffExpanded && action.counterfactual && (
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 18px',
                      marginTop: 6,
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Counterfactual Graph State Simulation (Before vs After Fix)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Global Network Risk</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: 2 }}>
                          <span style={{ color: '#f43f5e' }}>{action.counterfactual.beforeGlobalRisk}</span>
                          {' ➔ '}
                          <span style={{ color: '#10b981' }}>{action.counterfactual.afterGlobalRisk}</span>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Privacy Score</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: 2 }}>
                          <span style={{ color: '#94a3b8' }}>{action.counterfactual.beforeScore}</span>
                          {' ➔ '}
                          <span style={{ color: '#10b981' }}>+{action.counterfactual.afterScore - action.counterfactual.beforeScore} pts</span>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Single Points of Failure</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: 2 }}>
                          <span style={{ color: '#f43f5e' }}>{action.counterfactual.beforeSPOFCount}</span>
                          {' ➔ '}
                          <span style={{ color: '#10b981' }}>{action.counterfactual.afterSPOFCount}</span>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Node Blast Radius</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: 2 }}>
                          <span style={{ color: '#f59e0b' }}>{action.counterfactual.beforeBlastRadius} targets</span>
                          {' ➔ '}
                          <span style={{ color: '#10b981' }}>{action.counterfactual.afterBlastRadius}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Step-by-Step Remediation Guidance Modal */}
      {activeGuideAction && (
        <div className="modal-overlay" onClick={() => setActiveGuideAction(null)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>Remediation Walkthrough & Math Proof</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{activeGuideAction.title}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveGuideAction(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div className="glass-panel" style={{ padding: '14px 18px', marginBottom: 18, background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  Marginal ROI: -{activeGuideAction.relativeRiskReductionPercentage}% Total Network Risk (-{activeGuideAction.absoluteRiskReduction} points)
                </div>
                <p style={{ fontSize: '0.82rem', color: '#f1f5f9', marginTop: 4, fontStyle: 'italic' }}>
                  "{activeGuideAction.mathematicalProofRationale}"
                </p>
              </div>

              <h4 style={{ fontSize: '0.95rem', marginBottom: 12 }}>Step-by-Step Execution Guide:</h4>
              <ol style={{ paddingLeft: '22px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {getGuidanceSteps(activeGuideAction).map((step, idx) => (
                  <li key={idx} style={{ lineHeight: 1.5 }}>
                    {step}
                  </li>
                ))}
              </ol>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <button onClick={() => setActiveGuideAction(null)} className="btn-secondary">
                  Close Guide
                </button>
                {!completedActionIds.includes(activeGuideAction.id) && (
                  <button
                    onClick={() => {
                      handleFixClick(activeGuideAction);
                      setActiveGuideAction(null);
                    }}
                    className="btn-primary"
                  >
                    <Zap size={16} /> Mark as Fixed
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

