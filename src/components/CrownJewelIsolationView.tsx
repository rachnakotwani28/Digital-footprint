import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import type { Account, AliasProvider } from '../types/account';
import { 
  analyzeCrownJewelDecoupling, 
  applyAliasDecoupling 
} from '../services/isolationEngine';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Sparkles, 
  Zap, 
  Layers, 
  ArrowRight, 
  Flame, 
  CheckCircle2, 
  Mail, 
  ShieldX
} from 'lucide-react';

interface CrownJewelIsolationViewProps {
  accounts: Account[];
  onUpdateAccounts: (accounts: Account[]) => void;
  onOpenBreachSimulator: (accountId?: string) => void;
}

export const CrownJewelIsolationView: React.FC<CrownJewelIsolationViewProps> = ({
  accounts,
  onUpdateAccounts,
  onOpenBreachSimulator,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<AliasProvider>('simplelogin');

  const blueprint = analyzeCrownJewelDecoupling(accounts);

  const handleDecoupleSingleAccount = (accountId: string, provider: AliasProvider) => {
    const updated = applyAliasDecoupling(accounts, accountId, provider);
    onUpdateAccounts(updated);

    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.7 },
      colors: ['#8b5cf6', '#06b6d4', '#10b981'],
    });
  };

  const handleDecoupleAllPending = () => {
    let updated = [...accounts];
    blueprint.recommendations.forEach((rec) => {
      updated = applyAliasDecoupling(updated, rec.accountId, rec.suggestedProvider);
    });
    onUpdateAccounts(updated);

    confetti({
      particleCount: 140,
      spread: 100,
      origin: { y: 0.65 },
      colors: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero Architecture Header */}
      <div className="glass-panel" style={{ padding: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.4)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={13} /> USP 2: Crown Jewel Isolation & Burner Aliases
              </span>
              <span className="badge badge-cyan">Zero-Trust Identity Segmentation</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              Segmented Multi-Tier Identity Architecture
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
              Never link high-risk forums, shopping apps, or games to the primary email inbox that recovers your banking and cloud assets. By deploying <strong style={{ color: '#fff' }}>relayed burner aliases</strong>, you drop transitive attacker reachability into your Crown Jewels to <strong style={{ color: '#10b981' }}>0%</strong>.
            </p>
          </div>

          {/* Quick 1-Click Multi Decouple CTA */}
          {blueprint.recommendations.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleDecoupleAllPending}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.35)',
                  padding: '12px 20px',
                  fontWeight: 600,
                }}
              >
                <Zap size={16} /> 1-Click Decouple All ({blueprint.recommendations.length}) Tier 3 Accounts
              </button>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Auto-generates masked aliases & severs recovery bridges
              </div>
            </div>
          )}
        </div>

        {/* 4 Status KPI Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginTop: 22 }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
            <div style={{ fontSize: '0.75rem', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Tier 1 Crown Jewels
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
              {blueprint.totalCrownJewels}{' '}
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: blueprint.contaminatedCrownJewelsCount > 0 ? '#f43f5e' : '#10b981' }}>
                ({blueprint.isolatedCrownJewelsCount} isolated)
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Banking, AWS & Hardware Vaults
            </div>
          </div>

          <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
            <div style={{ fontSize: '0.75rem', color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Contaminated Bridges
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: blueprint.totalContaminatedBridges > 0 ? '#f43f5e' : '#10b981', marginTop: 4 }}>
              {blueprint.totalContaminatedBridges}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Shared inboxes & password groups
            </div>
          </div>

          <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Transitive Reachability
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: blueprint.transitiveReachabilityPercentage > 0 ? '#f59e0b' : '#10b981', marginTop: 4 }}>
              {blueprint.transitiveReachabilityPercentage}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Target: 0% after alias decoupling
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
            <div style={{ fontSize: '0.75rem', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Burner Aliases Active
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
              {accounts.filter((a) => a.isMaskedAlias).length}{' '}
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                of {blueprint.tier3DisposableAccounts.length}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              SimpleLogin / iCloud / DuckDuckGo
            </div>
          </div>
        </div>
      </div>

      {/* 3 Swimlanes: Tier 1 Vault, Tier 2 Daily/Work, Tier 3 Disposable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {/* Tier 1 Vault Swimlane */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderTop: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>
              <Lock size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>Tier 1: Vault (Crown Jewels)</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>High-security banking & crypto</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {blueprint.tier1VaultAccounts.map((acc) => {
              const isContaminated = blueprint.bridges.some((b) => b.targetCrownJewel.id === acc.id);
              return (
                <div
                  key={acc.id}
                  style={{
                    background: isContaminated ? 'rgba(244, 63, 94, 0.08)' : 'rgba(139, 92, 246, 0.06)',
                    border: isContaminated ? '1px solid rgba(244, 63, 94, 0.35)' : '1px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                      {acc.name}
                    </div>
                    {isContaminated ? (
                      <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                        Contaminated Bridge
                      </span>
                    ) : (
                      <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                        Isolated
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Sensitivity: {acc.sensitivityWeight}/10 • {acc.twoFactorType === 'hardware_key' ? 'Hardware Key 2FA' : '2FA Protected'}
                  </div>
                  {isContaminated && (
                    <div style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldX size={12} /> Shares recovery inbox with Tier 3 apps
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier 2 Social & Work Swimlane */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderTop: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)' }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>Tier 2: Work & Social</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SSO identity & daily developer tools</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {blueprint.tier2WorkAccounts.map((acc) => (
              <div
                key={acc.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                    {acc.name}
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                    Daily Work
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {acc.signInMethod === 'google_sso' ? 'Google SSO' : 'Direct login'} • Sensitivity {acc.sensitivityWeight}/10
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier 3 Burner / Disposable Swimlane */}
        <div className="glass-panel" style={{ padding: '18px 20px', borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
              <Mail size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>Tier 3: Burner / Disposable</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gaming, shopping, forums & utilities</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {blueprint.tier3DisposableAccounts.map((acc) => (
              <div
                key={acc.id}
                style={{
                  background: acc.isMaskedAlias ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.06)',
                  border: acc.isMaskedAlias ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                    {acc.name}
                  </div>
                  {acc.isMaskedAlias ? (
                    <span className="badge badge-low" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <CheckCircle2 size={11} /> Masked Burner
                    </span>
                  ) : (
                    <span className="badge badge-high" style={{ fontSize: '0.65rem' }}>
                      Unmasked Inbox
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.74rem', color: acc.isMaskedAlias ? '#34d399' : 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                  {acc.usernameOrEmail}
                </div>

                {!acc.isMaskedAlias && (
                  <button
                    onClick={() => handleDecoupleSingleAccount(acc.id, selectedProvider)}
                    className="btn-primary btn-sm"
                    style={{
                      marginTop: 8,
                      width: '100%',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      padding: '4px 8px',
                      background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                    }}
                  >
                    <Zap size={12} /> Decouple with {selectedProvider}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decoupling Blueprint Action Queue */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Decoupling Blueprint (Replace Inboxes with Masked Aliases)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Assigning randomized relay aliases breaks the inbound recovery path from low-trust services into your Crown Jewels.
            </p>
          </div>

          {/* Alias Provider Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Alias Provider:</span>
            {[
              { id: 'simplelogin', label: 'SimpleLogin' },
              { id: 'icloud_relay', label: 'iCloud Hide My Email' },
              { id: 'duckduckgo', label: 'DuckDuckGo Email' },
              { id: 'proton_alias', label: 'Proton Pass' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p.id as AliasProvider)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: selectedProvider === p.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  background: selectedProvider === p.id ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                  color: selectedProvider === p.id ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {blueprint.recommendations.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(16, 185, 129, 0.04)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <ShieldCheck size={36} style={{ color: '#10b981', margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>Pristine Crown Jewel Isolation Achieved!</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
              All Tier 3 disposable services are segregated using relayed burner aliases. Attacker reachability to your Vault is 0%.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {blueprint.recommendations.map((rec) => (
              <div
                key={rec.accountId}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#fff' }}>
                      {rec.accountName}
                    </h4>
                    <span className="badge badge-high" style={{ fontSize: '0.7rem' }}>
                      -{rec.reachabilityDropPercentage}% Inbound Risk
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      {rec.currentEmailOrInbox}
                    </span>
                    <ArrowRight size={14} style={{ color: 'var(--accent-cyan)' }} />
                    <span style={{ color: '#10b981', fontWeight: 600, fontFamily: 'monospace' }}>
                      {rec.suggestedAlias}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {rec.rationale}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => onOpenBreachSimulator(rec.accountId)}
                    className="btn-secondary btn-sm"
                    title="Simulate what happens if this forum leaks"
                  >
                    <Flame size={14} style={{ color: '#f43f5e' }} /> Test Breach Cascade
                  </button>
                  <button
                    onClick={() => handleDecoupleSingleAccount(rec.accountId, rec.suggestedProvider)}
                    className="btn-primary btn-sm"
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}
                  >
                    <Zap size={14} /> Apply Burner Alias
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contaminated Bridges Danger List */}
      {blueprint.bridges.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px 24px', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ShieldAlert size={22} style={{ color: '#f43f5e' }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                Detected Cross-Tier Contamination Bridges ({blueprint.bridges.length})
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Direct or transitive pathways where a breach in a low-trust account compromises a Tier 1 Crown Jewel.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
            {blueprint.bridges.map((bridge) => (
              <div
                key={bridge.id}
                style={{
                  background: 'rgba(244, 63, 94, 0.05)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fb7185' }}>
                    {bridge.sourceAccount.name} ➔ {bridge.targetCrownJewel.name}
                  </span>
                  <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                    {bridge.bridgeType.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {bridge.pathDescription}
                </p>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: 6, fontStyle: 'italic' }}>
                  💡 {bridge.mitigationRecommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
