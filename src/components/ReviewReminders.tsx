import React, { useState } from 'react';
import type { Account } from '../types/account';
import { Clock, CheckCircle2, Trash2, Calendar, Bell, AlertTriangle } from 'lucide-react';

interface ReviewRemindersProps {
  accounts: Account[];
  onUpdateAccounts: (accounts: Account[]) => void;
  onOpenBreachSimulator?: (originId?: string) => void;
}

export const ReviewReminders: React.FC<ReviewRemindersProps> = ({
  accounts,
  onUpdateAccounts,
  onOpenBreachSimulator,
}) => {
  const [reviewCycleDays, setReviewCycleDays] = useState<number>(90);
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  const now = new Date('2026-10-01').getTime();

  // Find accounts that haven't had activity or audit review in > reviewCycleDays
  const staleAccounts = accounts.filter((acc) => {
    const lastDate = new Date(acc.lastActivityDate).getTime();
    const daysSince = Math.floor((now - lastDate) / (1000 * 3600 * 24));
    return daysSince >= reviewCycleDays;
  });

  const handleMarkReviewed = (accountId: string) => {
    const updated = accounts.map((a) =>
      a.id === accountId
        ? { ...a, lastActivityDate: new Date().toISOString().split('T')[0] }
        : a
    );
    onUpdateAccounts(updated);
  };

  const handleMarkAllReviewed = () => {
    const today = new Date().toISOString().split('T')[0];
    const updated = accounts.map((a) => ({ ...a, lastActivityDate: today }));
    onUpdateAccounts(updated);
  };

  const handleDecommission = (accountId: string) => {
    if (confirm('Decommission and permanently remove this inactive account from your footprint?')) {
      onUpdateAccounts(accounts.filter((a) => a.id !== accountId));
    }
  };

  const handleTriggerSimulatedPrompt = () => {
    setShowNotificationToast(true);
    setTimeout(() => setShowNotificationToast(false), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toast Alert Simulator */}
      {showNotificationToast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #06b6d4',
            boxShadow: '0 10px 30px rgba(6, 182, 212, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            maxWidth: '420px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <Bell size={24} style={{ color: '#06b6d4', flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Periodic Privacy Review Prompt</strong>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              It has been {reviewCycleDays} days since your last footprint audit. {staleAccounts.length} accounts require re-verification.
            </p>
          </div>
        </div>
      )}

      {/* Configuration Header */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-cyan">
                <Clock size={12} /> Requirement 5: Periodic Review Prompts & Breach Alert Sandbox
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', marginTop: 6 }}>Review Reminders & Ghost Account Audits</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '650px' }}>
              Forgotten dormant accounts are prime targets for automated credential attacks. Set regular review cadences and clean up unused apps.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <Calendar size={16} style={{ color: 'var(--accent-cyan)' }} />
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Review Cadence:</label>
              <select
                className="form-control"
                style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
                value={reviewCycleDays}
                onChange={(e) => setReviewCycleDays(Number(e.target.value))}
              >
                <option value={30}>Every 30 Days (Strict)</option>
                <option value={90}>Every 90 Days (Recommended)</option>
                <option value={180}>Every 180 Days (Lenient)</option>
              </select>
            </div>

            <button onClick={handleTriggerSimulatedPrompt} className="btn-secondary btn-sm">
              <Bell size={14} /> Trigger Test Prompt
            </button>
          </div>
        </div>
      </div>

      {/* Stale Accounts List */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: '1.05rem' }}>
              Dormant & Ghost Accounts Requiring Review ({staleAccounts.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Accounts with no verified activity for over {reviewCycleDays} days.
            </p>
          </div>

          {staleAccounts.length > 0 && (
            <button onClick={handleMarkAllReviewed} className="btn-secondary btn-sm">
              <CheckCircle2 size={14} style={{ color: '#10b981' }} /> Mark All As Verified
            </button>
          )}
        </div>

        {staleAccounts.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#10b981' }}>
            <CheckCircle2 size={32} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 600 }}>All Accounts Are Actively Maintained!</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              No accounts in your footprint exceed your {reviewCycleDays}-day inactivity threshold.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {staleAccounts.map((acc) => {
              const daysSince = Math.floor(
                (now - new Date(acc.lastActivityDate).getTime()) / (1000 * 3600 * 24)
              );

              return (
                <div
                  key={acc.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {acc.name}
                      <span className="badge badge-moderate" style={{ fontSize: '0.7rem' }}>
                        {daysSince} days dormant
                      </span>
                      {acc.knownBreachesCount > 0 && (
                        <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
                          <AlertTriangle size={10} /> {acc.knownBreachesCount} known breaches
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {acc.usernameOrEmail} • Last active on {acc.lastActivityDate}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {onOpenBreachSimulator && (
                      <button
                        onClick={() => onOpenBreachSimulator(acc.id)}
                        className="btn-secondary btn-sm"
                        title="Simulate breach on this stale account"
                      >
                        Simulate Breach
                      </button>
                    )}
                    <button
                      onClick={() => handleMarkReviewed(acc.id)}
                      className="btn-secondary btn-sm"
                    >
                      <CheckCircle2 size={14} style={{ color: '#10b981' }} /> Mark Verified
                    </button>
                    <button
                      onClick={() => handleDecommission(acc.id)}
                      className="btn-danger btn-sm"
                    >
                      <Trash2 size={14} /> Delete & Decommission
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
