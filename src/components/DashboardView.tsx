import React from 'react';
import type { ExposureNetwork } from '../types/graph';
import type { RiskMetrics, RemediationAction } from '../types/risk';
import type { Account } from '../types/account';
import { ExposureGraph } from './ExposureGraph';
import type { ScoreHistoryPoint } from '../services/storage';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Key, 
  Layers, 
  TrendingUp, 
  Zap, 
  Flame,
  ChevronRight,
  Sparkles,
  TrendingDown,
  GitFork
} from 'lucide-react';

interface DashboardViewProps {
  metrics: RiskMetrics;
  network: ExposureNetwork;
  accounts?: Account[];
  topActions?: RemediationAction[];
  scoreHistory: ScoreHistoryPoint[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onNavigateToFixes: () => void;
  onNavigateToInventory: () => void;
  onOpenBreachSimulator: (accountId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  network,
  topActions = [],
  scoreHistory,
  selectedNodeId,
  onSelectNode,
  onNavigateToFixes,
  onNavigateToInventory,
  onOpenBreachSimulator,
}) => {
  const riskiestNodes = [...network.nodes]
    .sort((a, b) => b.effectiveRisk - a.effectiveRisk)
    .slice(0, 3);

  const spofNodes = network.nodes.filter((n) => n.isSPOF);
  const highestRoiAction = topActions.find((a) => !a.isCompleted) || topActions[0];

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#38bdf8';
    if (score >= 45) return '#f59e0b';
    return '#f43f5e';
  };

  const scoreColor = getScoreColor(metrics.overallPrivacyScore);

  const total = Math.max(metrics.totalAccounts, 1);
  const criticalPct = Math.round((metrics.tierBreakdown.critical / total) * 100);
  const highPct = Math.round((metrics.tierBreakdown.high / total) * 100);
  const modPct = Math.round((metrics.tierBreakdown.moderate / total) * 100);
  const lowPct = Math.round((metrics.tierBreakdown.low / total) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Radial Privacy Score Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 12 }}>
            Overall Privacy Health
          </div>

          <div style={{ position: 'relative', width: '160px', height: '160px', margin: '6px 0' }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeDasharray={`${(metrics.overallPrivacyScore / 100) * 251.2} 251.2`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff' }}>
                {metrics.overallPrivacyScore}
              </span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: scoreColor,
                  background: 'rgba(255, 255, 255, 0.06)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                Grade {metrics.grade}
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
            {metrics.overallPrivacyScore >= 80
              ? 'Strong network defense posture. Minimal transitive exposure.'
              : metrics.overallPrivacyScore >= 50
              ? 'Moderate exposure. Downstream links amplify credential risks.'
              : 'Severe exposure! Critical SPOFs threaten your core assets.'}
          </p>

          <button
            onClick={onNavigateToFixes}
            className="btn-primary btn-sm"
            style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
          >
            <Zap size={14} /> View Highest-Impact Fixes
          </button>
        </div>

        {/* 4 Essential Security Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Single Points of Failure (SPOF)</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: metrics.spofCount > 0 ? '#f43f5e' : '#10b981', marginTop: 4 }}>
                  {metrics.spofCount}
                </div>
              </div>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
                <AlertTriangle size={20} />
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>
              Accounts whose compromise cascades directly into 3+ other services.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Shared Password Groups</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: metrics.reusedPasswordAccountsCount > 0 ? '#f59e0b' : '#10b981', marginTop: 4 }}>
                  {metrics.reusedPasswordAccountsCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>accounts</span>
                </div>
              </div>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <Key size={20} />
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>
              Reusing credentials creates lateral credential-stuffing attack bridges.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Missing 2-Factor Auth</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: metrics.missing2FACount > 0 ? '#f43f5e' : '#10b981', marginTop: 4 }}>
                  {metrics.missing2FACount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>of {metrics.totalAccounts}</span>
                </div>
              </div>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
                <ShieldAlert size={20} />
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>
              Accounts vulnerable to password stuffing and phishing bypasses.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Excessive Permission Apps</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: metrics.highRiskPermissionsCount > 0 ? '#f59e0b' : '#10b981', marginTop: 4 }}>
                  {metrics.highRiskPermissionsCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>apps</span>
                </div>
              </div>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
                <Layers size={20} />
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>
              Apps requesting 3+ invasive hardware permissions (Camera, Location, Contacts).
            </p>
          </div>
        </div>
      </div>

      {/* Risk Distribution Breakdown Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, color: '#fff' }}>Footprint Risk Tier Distribution:</span>
          <div style={{ display: 'flex', gap: 14, fontSize: '0.75rem' }}>
            <span style={{ color: '#f43f5e' }}>● {metrics.tierBreakdown.critical} Critical ({criticalPct}%)</span>
            <span style={{ color: '#f97316' }}>● {metrics.tierBreakdown.high} High ({highPct}%)</span>
            <span style={{ color: '#f59e0b' }}>● {metrics.tierBreakdown.moderate} Moderate ({modPct}%)</span>
            <span style={{ color: '#10b981' }}>● {metrics.tierBreakdown.low} Secure ({lowPct}%)</span>
          </div>
        </div>
        <div style={{ height: '10px', width: '100%', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: `${criticalPct}%`, background: '#f43f5e', transition: 'width 0.4s' }} />
          <div style={{ width: `${highPct}%`, background: '#f97316', transition: 'width 0.4s' }} />
          <div style={{ width: `${modPct}%`, background: '#f59e0b', transition: 'width 0.4s' }} />
          <div style={{ width: `${lowPct}%`, background: '#10b981', transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* Single Points of Failure Warning Banner */}
      {spofNodes.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <AlertTriangle size={28} style={{ color: '#ef4444' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ fontSize: '1rem', color: '#fff' }}>Single Points of Failure Detected</h4>
                <span className="badge badge-critical">{spofNodes.length} Critical Accounts</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#fca5a5', marginTop: 2 }}>
                {spofNodes.map((n) => n.name).join(', ')} controls access to multiple dependent services without 2FA protection.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenBreachSimulator(spofNodes[0]?.id)}
            className="btn-danger btn-sm"
          >
            <Flame size={14} /> Simulate SPOF Cascade Breach
          </button>
        </div>
      )}

      {/* Highest Marginal ROI Action Hero Showcase (USP #2) */}
      {highestRoiAction && !highestRoiAction.isCompleted && (
        <div
          className="glass-panel"
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ maxWidth: '760px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={12} /> #1 Ranked Action (Marginal Risk Optimization)
              </span>
              <span
                className="badge"
                style={{
                  background: 'rgba(244, 63, 94, 0.18)',
                  color: '#fb7185',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <TrendingDown size={12} /> -{highestRoiAction.relativeRiskReductionPercentage}% Total Network Risk
              </span>
              <span
                className="badge"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GitFork size={12} /> {highestRoiAction.severedAttackPathsCount} Paths Severed
              </span>
            </div>

            <h4 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
              {highestRoiAction.title}
            </h4>

            <div
              style={{
                fontSize: '0.84rem',
                color: '#e2e8f0',
                marginTop: 6,
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--accent-cyan)',
                fontStyle: 'italic',
              }}
            >
              "{highestRoiAction.mathematicalProofRationale}"
            </div>
          </div>

          <button
            onClick={onNavigateToFixes}
            className="btn-primary"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.25)',
            }}
          >
            <Zap size={15} /> Resolve in Queue
          </button>
        </div>
      )}

      {/* Main Exposure Graph Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Digital Footprint Exposure Graph</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Interactive network of accounts, email recovery chains, and SSO sign-in links. Risk cascades through connections.
            </p>
          </div>
          <button onClick={() => onOpenBreachSimulator()} className="btn-secondary btn-sm">
            <Flame size={14} style={{ color: '#f43f5e' }} /> Launch Threat Sandbox
          </button>
        </div>

        <ExposureGraph
          network={network}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          onSimulateBreachFromNode={(id) => onOpenBreachSimulator(id)}
        />
      </div>

      {/* Two Column Section: Riskiest Accounts & Score Improvement Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top 3 Riskiest Accounts */}
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: '1rem' }}>Top Riskiest Accounts</h3>
            <button onClick={onNavigateToInventory} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {riskiestNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {node.name}
                    {node.isSPOF && <span className="badge badge-spof" style={{ fontSize: '0.65rem' }}>SPOF</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Base: {node.baseRisk} • Transitive cascade: +{Math.max(0, node.effectiveRisk - node.baseRisk)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge badge-${node.riskTier}`} style={{ fontSize: '0.85rem' }}>
                    {node.effectiveRisk}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Improvement Timeline */}
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: '#10b981' }} />
              <h3 style={{ fontSize: '1rem' }}>Score Improvement Over Time</h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
              +{metrics.overallPrivacyScore - (scoreHistory[0]?.score || 38)} Pts Growth
            </span>
          </div>

          <div style={{ height: '140px', width: '100%', position: 'relative', marginTop: 10 }}>
            <svg viewBox="0 0 300 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="score-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
              <line x1="0" y1="60" x2="300" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />

              {(() => {
                const points = scoreHistory.map((h, i) => {
                  const x = (i / Math.max(scoreHistory.length - 1, 1)) * 300;
                  const y = 90 - (h.score / 100) * 80;
                  return { x, y, ...h };
                });

                const dPath = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
                const areaPath = `${dPath} L 300 100 L 0 100 Z`;

                return (
                  <>
                    <path d={areaPath} fill="url(#score-grad)" />
                    <path d={dPath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                        <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#fff" fontSize="9px" fontWeight="700">
                          {p.score}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
            <span>{scoreHistory[0]?.date || 'Start'}</span>
            <span>Current ({new Date().toISOString().split('T')[0]})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
