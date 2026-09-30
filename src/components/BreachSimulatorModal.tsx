import React, { useState } from 'react';
import type { Account } from '../types/account';
import type { BreachSimulationResult } from '../types/risk';
import { simulateBreach } from '../services/simulationEngine';
import { 
  AlertTriangle, 
  Flame, 
  ArrowRight, 
  Clock, 
  X,
  Copy,
  Check,
  Zap
} from 'lucide-react';

interface BreachSimulatorModalProps {
  accounts: Account[];
  initialOriginAccountId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BreachSimulatorModal: React.FC<BreachSimulatorModalProps> = ({
  accounts,
  initialOriginAccountId,
  isOpen,
  onClose,
}) => {
  const [selectedOriginId, setSelectedOriginId] = useState<string>(
    initialOriginAccountId || accounts[0]?.id || ''
  );
  const [simulationResult, setSimulationResult] = useState<BreachSimulationResult | null>(null);
  const [copiedPlan, setCopiedPlan] = useState(false);

  if (!isOpen) return null;

  const handleRunSimulation = () => {
    if (!selectedOriginId) return;
    try {
      const result = simulateBreach(selectedOriginId, accounts);
      setSimulationResult(result);
    } catch (e) {
      console.error('Simulation error:', e);
    }
  };

  const handleRunPresetScenario = (scenarioOriginId: string) => {
    setSelectedOriginId(scenarioOriginId);
    try {
      const result = simulateBreach(scenarioOriginId, accounts);
      setSimulationResult(result);
    } catch (e) {
      console.error('Simulation error:', e);
    }
  };

  const handleCopyPlan = () => {
    if (!simulationResult) return;
    const planText = `[INCIDENT RESPONSE PLAN - SIMULATED BREACH: ${simulationResult.originAccountName}]
Compromised Total: ${simulationResult.totalAffectedAccounts} accounts
Critical Assets Exposed: ${simulationResult.criticalAssetsBreached.map((a) => a.name).join(', ') || 'None'}

EMERGENCY ACTIONS:
1. Revoke active sessions on ${simulationResult.originAccountName}
2. Isolate shared passwords across ${simulationResult.directlyCompromisedIds.length} connected accounts
3. Check email forwarding rules and secondary recovery inboxes`;

    navigator.clipboard.writeText(planText);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '840px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 26px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(244, 63, 94, 0.14) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 63, 94, 0.2)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f43f5e',
              }}
            >
              <Flame size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Simulated Breach & Blast Radius Sandbox</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Requirement 5: Test real-world "What-If" crisis scenarios showing lateral credential-stuffing and SSO cascades.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Preset Attack Scenarios */}
          <div style={{ marginBottom: 18 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              Quick-Launch Threat Scenarios:
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleRunPresetScenario('acc_old_gaming_forum')}
                className="btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                <Zap size={12} style={{ color: '#f59e0b' }} /> Scenario 1: Third-Party Forum Database Leak
              </button>
              <button
                onClick={() => handleRunPresetScenario('acc_google_primary')}
                className="btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                <Zap size={12} style={{ color: '#f43f5e' }} /> Scenario 2: Primary Email Account Phishing Takeover
              </button>
            </div>
          </div>

          {/* Target Account Selector */}
          <div className="glass-panel" style={{ padding: '18px 20px', marginBottom: 20 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Select Compromised Entry Account:
            </label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <select
                className="form-control"
                value={selectedOriginId}
                onChange={(e) => {
                  setSelectedOriginId(e.target.value);
                  setSimulationResult(null);
                }}
                style={{ flex: 1 }}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.usernameOrEmail}) — {a.serviceCategory}
                  </option>
                ))}
              </select>

              <button onClick={handleRunSimulation} className="btn-danger" style={{ whiteSpace: 'nowrap' }}>
                <Flame size={16} /> Detonate Simulation
              </button>
            </div>
          </div>

          {/* Simulation Output */}
          {simulationResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeIn 0.25s ease-out' }}>
              {/* Blast Radius Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <div
                  style={{
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Total Accounts Compromised</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f43f5e' }}>
                    {simulationResult.totalAffectedAccounts} of {accounts.length}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {Math.round((simulationResult.totalAffectedAccounts / accounts.length) * 100)}% of your footprint
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#fcd34d' }}>Critical Assets Exposed</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>
                    {simulationResult.criticalAssetsBreached.length}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    High-value banks, cloud docs & repos
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>Cascade Chain Depth</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8' }}>
                    {simulationResult.cascadeSteps.length} hops
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Multi-vector lateral takeover
                  </div>
                </div>
              </div>

              {/* Critical Assets Alert */}
              {simulationResult.criticalAssetsBreached.length > 0 && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <AlertTriangle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.9rem' }}>High-Impact Takeover Alert!</strong>
                    <p style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: 2 }}>
                      Breaching <strong>{simulationResult.originAccountName}</strong> cascaded into crucial assets:{' '}
                      {simulationResult.criticalAssetsBreached.map((a) => a.name).join(', ')}.
                    </p>
                  </div>
                </div>
              )}

              {/* Step-by-Step Cascade Propagation Log */}
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} style={{ color: 'var(--accent-cyan)' }} /> Compromise Chronology & Attack Vectors
                </h4>
                {simulationResult.cascadeSteps.length === 0 ? (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: 'var(--radius-md)', color: '#6ee7b7', fontSize: '0.85rem' }}>
                    ✓ Contained Incident: This account does not share credentials, handle SSO, or act as an email recovery hub. No lateral movement possible!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '280px', overflowY: 'auto' }}>
                    {simulationResult.cascadeSteps.map((step) => (
                      <div
                        key={step.step}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                            Hop #{step.step}: {step.vector}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {step.sourceAccountName} <ArrowRight size={12} style={{ verticalAlign: 'middle' }} /> {step.targetAccountName}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {step.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emergency Response Runbook */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Recommended Emergency Response Plan:</h4>
                  <button onClick={handleCopyPlan} className="btn-secondary btn-sm" style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                    {copiedPlan ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                    {copiedPlan ? 'Copied to Clipboard' : 'Copy Response Plan'}
                  </button>
                </div>
                <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Immediately invalidate current sessions on <strong>{simulationResult.originAccountName}</strong>.</li>
                  {simulationResult.cascadeSteps.some((s) => s.vector.includes('Shared Password')) && (
                    <li>Reset passwords across all accounts sharing this password group and migrate to unique passwords.</li>
                  )}
                  {simulationResult.cascadeSteps.some((s) => s.vector.includes('Recovery')) && (
                    <li>Change the recovery email on dependent accounts to a separated, hardware-2FA-protected mailbox.</li>
                  )}
                  <li>Audit API access tokens and forwarding email rules created during the breach window.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
