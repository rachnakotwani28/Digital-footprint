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
  Shield
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

  const potentialScoreJump = pendingActions.reduce((sum, a) => sum + a.impactScore, 0);

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

  const getGuidanceSteps = (action: RemediationAction) => {
    switch (action.category) {
      case 'enable_2fa':
        return [
          `Log in to your ${action.accountName} account settings.`,
          'Navigate to "Security" or "Sign-in Options".',
          'Locate "2-Step Verification" / "Two-Factor Authentication".',
          'Choose "Authenticator App" (e.g. Google Authenticator, Bitwarden, or 1Password) or a Hardware Security Key (YubiKey).',
          'Scan the QR code and verify the 6-digit confirmation code.',
        ];
      case 'isolate_password':
        return [
          `Open your password manager and generate a strong, unique 20+ character random password.`,
          `Log in to ${action.accountName} and go to "Account Settings" > "Change Password".`,
          'Replace the shared password with your new unique password.',
          'Ensure this password is not used for any other account or email inbox.',
        ];
      case 'revoke_permission':
        return [
          `Open your mobile device Settings (iOS or Android).`,
          `Navigate to "Apps" > "${action.accountName}" > "Permissions".`,
          'Revoke background location access, microphone, and full contacts access.',
          'Set location permission to "Only While Using App" or "Never".',
        ];
      case 'decommission_stale':
        return [
          `Log in to ${action.accountName} and navigate to "Privacy / Account Management".`,
          'Request permanent account deletion and data wipe.',
          'Unlink any associated OAuth authorizations and delete saved payment methods.',
        ];
      default:
        return ['Follow the security recommendations to mitigate exposure.'];
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Progress & Ranking Hero Card */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-cyan">
                <Sparkles size={12} /> Requirement 3: Marginal Risk Reduction Ranking (ΔRisk)
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', marginTop: 6 }}>Prioritized Remediation Queue</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '650px' }}>
              Every fix is scored by counterfactual network simulation: evaluating how many downstream attack paths are severed when the safeguard is applied.
            </p>
          </div>

          {/* Quick-Wins CTA & Progress Widget */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            {pendingActions.length > 0 && (
              <button
                onClick={handleApplyTop3QuickWins}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)' }}
              >
                <Zap size={16} /> 1-Click Resolve Top 3 Fixes
              </button>
            )}

            <div style={{ minWidth: '220px', background: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Remediation Progress:</span>
                <strong style={{ color: '#10b981' }}>{completionPercentage}%</strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
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
                <span>{completedCount} of {totalActions} fixes completed</span>
                {potentialScoreJump > 0 && (
                  <span style={{ color: '#38bdf8' }}>+{potentialScoreJump} Pts Possible</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `Pending Actions (${pendingActions.length})` },
            { id: 'enable_2fa', label: '2FA Upgrades' },
            { id: 'isolate_password', label: 'Password Decoupling' },
            { id: 'revoke_permission', label: 'Permission Audits' },
            { id: 'decommission_stale', label: 'Stale Account Deletion' },
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredActions.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CheckCircle size={36} style={{ color: '#10b981', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>No Pending Actions in this Category</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              All recommendations in this section have been resolved. Your network defense is significantly stronger!
            </p>
          </div>
        ) : (
          filteredActions.map((action, index) => {
            const isCompleted = completedActionIds.includes(action.id);

            return (
              <div
                key={action.id}
                className="glass-panel"
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  opacity: isCompleted ? 0.6 : 1,
                  borderLeft: `4px solid ${
                    isCompleted
                      ? '#10b981'
                      : index === 0
                      ? '#f43f5e'
                      : index < 3
                      ? '#f97316'
                      : 'var(--accent-cyan)'
                  }`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
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

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: isCompleted ? 'var(--text-muted)' : '#f8fafc' }}>
                        {action.title}
                      </h4>
                      <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                        +{action.impactScore} Pts Security Delta
                      </span>
                      {index === 0 && !isCompleted && (
                        <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
                          HIGHEST ROI FIX
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4, maxWidth: '780px' }}>
                      {action.description}
                    </p>
                  </div>
                </div>

                {/* Actions & Guide Trigger */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => setActiveGuideAction(action)}
                    className="btn-secondary btn-sm"
                    title="View Step-by-Step Fix Guidance"
                  >
                    <Info size={14} /> Guide
                  </button>

                  {isCompleted ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                      <CheckCircle size={16} /> Resolved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleFixClick(action)}
                      className="btn-primary btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <Zap size={14} /> Apply Fix Now
                    </button>
                  )}
                </div>
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
                  <h3 style={{ fontSize: '1.15rem' }}>Remediation Walkthrough</h3>
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
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                  Security Impact: +{activeGuideAction.impactScore} Points Risk Reduction
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {activeGuideAction.description}
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
