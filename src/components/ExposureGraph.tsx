import React, { useState, useMemo } from 'react';
import type { ExposureNetwork, GraphEdge, GraphNode } from '../types/graph';
import type { LayoutMode } from '../services/graphEngine';
import { findAttackPath } from '../services/graphEngine';
import { 
  AlertTriangle, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layers, 
  Crosshair, 
  ArrowRight
} from 'lucide-react';

interface ExposureGraphProps {
  network: ExposureNetwork;
  selectedNodeId: string | null;
  layoutMode?: LayoutMode;
  onSelectNode: (nodeId: string | null) => void;
  onLayoutChange?: (mode: LayoutMode) => void;
  onSimulateBreachFromNode?: (nodeId: string) => void;
}

export const ExposureGraph: React.FC<ExposureGraphProps> = ({
  network,
  selectedNodeId,
  layoutMode = 'concentric',
  onSelectNode,
  onLayoutChange,
  onSimulateBreachFromNode,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [activeEdgeFilter, setActiveEdgeFilter] = useState<'ALL' | 'SSO' | 'RECOVERY' | 'PASSWORD'>('ALL');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Attack Path Finder Mode State
  const [pathFinderActive, setPathFinderActive] = useState(false);
  const [pathSourceId, setPathSourceId] = useState<string>('acc_old_gaming_forum');
  const [pathTargetId, setPathTargetId] = useState<string>('acc_chase_bank');

  const { nodes, edges } = network;
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Compute Attack Path if path finder is enabled
  const calculatedAttackPath = useMemo(() => {
    if (!pathFinderActive || !pathSourceId || !pathTargetId) return null;
    return findAttackPath(pathSourceId, pathTargetId, network);
  }, [pathFinderActive, pathSourceId, pathTargetId, network]);

  const pathNodeSet = useMemo(() => {
    return new Set(calculatedAttackPath ? calculatedAttackPath.nodes : []);
  }, [calculatedAttackPath]);

  const pathEdgeSet = useMemo(() => {
    return new Set(calculatedAttackPath ? calculatedAttackPath.edges.map((e) => e.id) : []);
  }, [calculatedAttackPath]);

  // Filter edges based on filter pill
  const visibleEdges = useMemo(() => {
    return edges.filter((e) => {
      if (activeEdgeFilter === 'ALL') return true;
      if (activeEdgeFilter === 'SSO') return e.relationType === 'SSO_AUTH';
      if (activeEdgeFilter === 'RECOVERY') return e.relationType === 'RECOVERY_CHANNEL';
      if (activeEdgeFilter === 'PASSWORD') return e.relationType === 'PASSWORD_REUSE';
      return true;
    });
  }, [edges, activeEdgeFilter]);

  // Connected nodes mapping for hover highlighting
  const connectedToHover = useMemo(() => {
    if (!hoveredNodeId) return null;
    const connected = new Set<string>();
    connected.add(hoveredNodeId);
    edges.forEach((e) => {
      if (e.source === hoveredNodeId) connected.add(e.target);
      if (e.target === hoveredNodeId) connected.add(e.source);
    });
    return connected;
  }, [hoveredNodeId, edges]);

  const getNodeColor = (tier: GraphNode['riskTier']) => {
    switch (tier) {
      case 'critical':
        return '#f43f5e';
      case 'high':
        return '#f97316';
      case 'moderate':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#06b6d4';
    }
  };

  const getEdgeStyle = (edge: GraphEdge) => {
    const isPathEdge = pathEdgeSet.has(edge.id);
    const isSelectedChain =
      selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);
    const isHoverChain =
      hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);

    let stroke = 'rgba(148, 163, 184, 0.2)';
    let strokeDasharray = 'none';
    let strokeWidth = 1.5;

    if (isPathEdge) {
      stroke = '#ec4899'; // Neon Pink for Attack Path
      strokeWidth = 3.5;
    } else if (edge.relationType === 'SSO_AUTH') {
      stroke = isSelectedChain || isHoverChain ? '#38bdf8' : 'rgba(56, 189, 248, 0.35)';
      strokeWidth = isSelectedChain || isHoverChain ? 2.8 : 1.8;
    } else if (edge.relationType === 'RECOVERY_CHANNEL') {
      stroke = isSelectedChain || isHoverChain ? '#fbbf24' : 'rgba(251, 191, 36, 0.35)';
      strokeDasharray = '5,4';
      strokeWidth = isSelectedChain || isHoverChain ? 2.8 : 1.8;
    } else if (edge.relationType === 'PASSWORD_REUSE') {
      stroke = isSelectedChain || isHoverChain ? '#f43f5e' : 'rgba(244, 63, 94, 0.35)';
      strokeDasharray = '2,3';
      strokeWidth = isSelectedChain || isHoverChain ? 2.8 : 1.5;
    }

    return { stroke, strokeDasharray, strokeWidth, isPathEdge };
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '650px', overflow: 'hidden' }} className="glass-panel">
      {/* Top Controls Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Link Type Selector */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '4px',
              display: 'flex',
              gap: 4,
            }}
          >
            {(['ALL', 'SSO', 'RECOVERY', 'PASSWORD'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveEdgeFilter(filter)}
                style={{
                  background: activeEdgeFilter === filter ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                  color: activeEdgeFilter === filter ? '#fff' : 'var(--text-secondary)',
                  border: activeEdgeFilter === filter ? '1px solid rgba(6, 182, 212, 0.4)' : 'none',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {filter === 'ALL'
                  ? 'All Vectors'
                  : filter === 'SSO'
                  ? 'SSO Login'
                  : filter === 'RECOVERY'
                  ? 'Email Recovery'
                  : 'Shared Password'}
              </button>
            ))}
          </div>

          {/* Layout Mode Selector */}
          {onLayoutChange && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.88)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Layers size={14} style={{ color: 'var(--accent-cyan)' }} />
              <select
                className="form-control"
                style={{ width: 'auto', padding: '2px 6px', fontSize: '0.75rem', border: 'none', background: 'transparent' }}
                value={layoutMode}
                onChange={(e) => onLayoutChange(e.target.value as LayoutMode)}
              >
                <option value="concentric">Concentric Rings</option>
                <option value="hierarchical">Hierarchical Pipeline</option>
                <option value="cluster">Category Clusters</option>
              </select>
            </div>
          )}

          {/* Attack Path Trace Mode Toggle */}
          <button
            onClick={() => setPathFinderActive(!pathFinderActive)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: pathFinderActive ? '1px solid #ec4899' : '1px solid var(--border-subtle)',
              background: pathFinderActive ? 'rgba(236, 72, 153, 0.2)' : 'rgba(15, 23, 42, 0.88)',
              color: pathFinderActive ? '#f472b6' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Crosshair size={14} /> Attack Path Tracer
          </button>
        </div>

        {/* Zoom & Reset Controls */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
          }}
        >
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.8))}
            title="Zoom In"
            style={{ background: 'transparent', border: 'none', color: '#fff', padding: '6px', cursor: 'pointer' }}
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
            title="Zoom Out"
            style={{ background: 'transparent', border: 'none', color: '#fff', padding: '6px', cursor: 'pointer' }}
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            title="Reset Zoom & Pan"
            style={{ background: 'transparent', border: 'none', color: '#fff', padding: '6px', cursor: 'pointer' }}
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Attack Path Tracer Configuration Bar */}
      {pathFinderActive && (
        <div
          style={{
            position: 'absolute',
            top: 70,
            left: 16,
            right: 16,
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(236, 72, 153, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: '320px' }}>
            <span style={{ fontSize: '0.8rem', color: '#f472b6', fontWeight: 600 }}>Breach Source:</span>
            <select
              className="form-control"
              style={{ padding: '4px 8px', fontSize: '0.78rem', flex: 1 }}
              value={pathSourceId}
              onChange={(e) => setPathSourceId(e.target.value)}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} (Risk {n.effectiveRisk})
                </option>
              ))}
            </select>

            <ArrowRight size={16} style={{ color: '#ec4899' }} />

            <span style={{ fontSize: '0.8rem', color: '#f472b6', fontWeight: 600 }}>Target Asset:</span>
            <select
              className="form-control"
              style={{ padding: '4px 8px', fontSize: '0.78rem', flex: 1 }}
              value={pathTargetId}
              onChange={(e) => setPathTargetId(e.target.value)}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.account.sensitivityWeight >= 8 ? 'Crown Jewel' : 'Asset'})
                </option>
              ))}
            </select>
          </div>

          <div>
            {calculatedAttackPath ? (
              <span className="badge badge-critical" style={{ fontSize: '0.75rem' }}>
                <AlertTriangle size={12} /> Direct Compromise Path Found ({calculatedAttackPath.edges.length} Hops)
              </span>
            ) : (
              <span className="badge badge-low" style={{ fontSize: '0.75rem' }}>
                ✓ No Multi-Hop Attack Path Exists
              </span>
            )}
          </div>
        </div>
      )}

      {/* SVG Exposure Canvas */}
      <svg
        style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, rgba(13, 20, 36, 0.95) 0%, #060911 100%)',
          cursor: 'grab',
        }}
        viewBox="0 0 1000 760"
      >
        <defs>
          <marker id="arrow-sso" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
          </marker>
          <marker id="arrow-recovery" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
          </marker>
          <marker id="arrow-pwd" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
          </marker>
          <marker id="arrow-attack" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ec4899" />
          </marker>

          <filter id="glow-attack" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g
          transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
          style={{ transformOrigin: '500px 380px', transition: 'transform 0.25s ease' }}
        >
          {/* Directed Graph Edges */}
          {visibleEdges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const x1 = sourceNode.x || 500;
            const y1 = sourceNode.y || 380;
            const x2 = targetNode.x || 500;
            const y2 = targetNode.y || 380;

            const style = getEdgeStyle(edge);
            const isDimmed =
              connectedToHover &&
              !connectedToHover.has(edge.source) &&
              !connectedToHover.has(edge.target);

            const markerId = style.isPathEdge
              ? 'url(#arrow-attack)'
              : edge.relationType === 'SSO_AUTH'
              ? 'url(#arrow-sso)'
              : edge.relationType === 'RECOVERY_CHANNEL'
              ? 'url(#arrow-recovery)'
              : 'url(#arrow-pwd)';

            return (
              <g key={edge.id} opacity={isDimmed ? 0.15 : 1}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  strokeDasharray={style.strokeDasharray}
                  markerEnd={markerId}
                  filter={style.isPathEdge ? 'url(#glow-attack)' : undefined}
                />
              </g>
            );
          })}

          {/* Graph Nodes */}
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isHovered = node.id === hoveredNodeId;
            const isPathNode = pathNodeSet.has(node.id);
            const isDimmed = connectedToHover && !connectedToHover.has(node.id);

            const cx = node.x || 500;
            const cy = node.y || 380;
            const nodeColor = isPathNode ? '#ec4899' : getNodeColor(node.riskTier);

            return (
              <g
                key={node.id}
                transform={`translate(${cx}, ${cy})`}
                onClick={() => onSelectNode(isSelected ? null : node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                opacity={isDimmed ? 0.2 : 1}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s ease' }}
              >
                {/* SPOF Pulsing Warning Ring */}
                {node.isSPOF && (
                  <circle
                    r="34"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    opacity="0.8"
                    strokeDasharray="4,3"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0"
                      to="360"
                      dur="12s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Selection / Attack Path Halo */}
                {(isSelected || isPathNode) && (
                  <circle
                    r="36"
                    fill="none"
                    stroke={isPathNode ? '#ec4899' : '#06b6d4'}
                    strokeWidth="3"
                    opacity="0.85"
                  />
                )}

                {/* Base Node Circle */}
                <circle
                  r={node.isSPOF ? 26 : 22}
                  fill="#0f172a"
                  stroke={nodeColor}
                  strokeWidth={isSelected || isHovered || isPathNode ? 3 : 2}
                  style={{
                    filter: isSelected || isPathNode ? `drop-shadow(0 0 10px ${nodeColor})` : 'none',
                    transition: 'all 0.2s',
                  }}
                />

                {/* Risk Meter Track */}
                <circle
                  r={node.isSPOF ? 21 : 17}
                  fill="none"
                  stroke={nodeColor}
                  strokeWidth="3"
                  strokeDasharray={`${(node.effectiveRisk / 100) * 110} 110`}
                  opacity="0.9"
                  transform="rotate(-90)"
                />

                {/* Node Score In Center */}
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#ffffff"
                  fontSize={node.isSPOF ? '11px' : '10px'}
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.effectiveRisk}
                </text>

                {/* Node Name Below */}
                <text
                  textAnchor="middle"
                  dy="42"
                  fill={isSelected ? '#38bdf8' : isPathNode ? '#f472b6' : '#e2e8f0'}
                  fontSize="11px"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  {node.name.length > 18 ? node.name.slice(0, 16) + '…' : node.name}
                </text>

                {/* SPOF or Crown Jewel Badge */}
                {node.isSPOF ? (
                  <g transform="translate(0, -32)">
                    <rect x="-24" y="-8" width="48" height="15" rx="7" fill="#ef4444" />
                    <text textAnchor="middle" dy="3" fill="#ffffff" fontSize="8.5px" fontWeight="800">
                      SPOF
                    </text>
                  </g>
                ) : node.account.sensitivityWeight >= 9 ? (
                  <g transform="translate(0, -32)">
                    <rect x="-28" y="-8" width="56" height="15" rx="7" fill="#8b5cf6" />
                    <text textAnchor="middle" dy="3" fill="#ffffff" fontSize="8px" fontWeight="700">
                      CROWN JEWEL
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected Node Deep Inspector Panel */}
      {selectedNode && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            width: '370px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(16px)',
            zIndex: 20,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <span className={`badge badge-${selectedNode.riskTier}`} style={{ marginBottom: 6 }}>
                Effective Risk {selectedNode.effectiveRisk} / 100 • {selectedNode.riskTier.toUpperCase()}
              </span>
              <h3 style={{ fontSize: '1.05rem', marginTop: 2 }}>{selectedNode.name}</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedNode.account.usernameOrEmail}</p>
            </div>
            <button
              onClick={() => onSelectNode(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Inherent Base Risk</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>{selectedNode.baseRisk}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cascade Risk</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: selectedNode.effectiveRisk > selectedNode.baseRisk ? '#f43f5e' : '#10b981' }}>
                +{Math.max(0, selectedNode.effectiveRisk - selectedNode.baseRisk)}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span>Downstream Blast Radius:</span>
              <strong style={{ color: selectedNode.downstreamBlastRadiusCount >= 3 ? '#f43f5e' : '#fff' }}>
                {selectedNode.downstreamBlastRadiusCount} accounts fall
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span>Upstream Exposure Vectors:</span>
              <strong>{selectedNode.upstreamExposureCount} controlling origins</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>2-Factor Auth Status:</span>
              <strong style={{ color: selectedNode.account.has2FA ? '#10b981' : '#f43f5e' }}>
                {selectedNode.account.has2FA ? `Enabled (${selectedNode.account.twoFactorType})` : 'MISSING (Vulnerable)'}
              </strong>
            </div>
          </div>

          {onSimulateBreachFromNode && (
            <button
              onClick={() => onSimulateBreachFromNode(selectedNode.id)}
              className="btn-danger btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <AlertTriangle size={14} /> Simulate Breach On This Account
            </button>
          )}
        </div>
      )}
    </div>
  );
};
