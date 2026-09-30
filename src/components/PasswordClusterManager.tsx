import React, { useState } from 'react';
import type { PasswordCluster, Account } from '../types/account';
import { Lock, Plus, Trash2, ShieldAlert, ShieldCheck, Edit3 } from 'lucide-react';

interface PasswordClusterManagerProps {
  clusters: PasswordCluster[];
  accounts: Account[];
  onUpdateClusters: (clusters: PasswordCluster[]) => void;
  onUpdateAccounts: (accounts: Account[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordClusterManager: React.FC<PasswordClusterManagerProps> = ({
  clusters,
  accounts,
  onUpdateClusters,
  onUpdateAccounts,
  isOpen,
  onClose,
}) => {
  const [newClusterLabel, setNewClusterLabel] = useState('');
  const [newClusterColor, setNewClusterColor] = useState('#f59e0b');
  const [newClusterDesc, setNewClusterDesc] = useState('');
  const [editingClusterId, setEditingClusterId] = useState<string | null>(null);

  if (!isOpen) return null;

  const clusterMemberCounts = new Map<string, number>();
  accounts.forEach((acc) => {
    if (acc.passwordClusterId) {
      clusterMemberCounts.set(
        acc.passwordClusterId,
        (clusterMemberCounts.get(acc.passwordClusterId) || 0) + 1
      );
    }
  });

  const handleCreateCluster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClusterLabel.trim()) return;

    if (editingClusterId) {
      onUpdateClusters(
        clusters.map((c) =>
          c.id === editingClusterId
            ? { ...c, label: newClusterLabel.trim(), color: newClusterColor, description: newClusterDesc.trim() }
            : c
        )
      );
      setEditingClusterId(null);
    } else {
      const newCluster: PasswordCluster = {
        id: `cluster_${Date.now()}`,
        label: newClusterLabel.trim(),
        color: newClusterColor,
        description: newClusterDesc.trim() || 'Custom user-defined password reuse group',
      };
      onUpdateClusters([...clusters, newCluster]);
    }

    setNewClusterLabel('');
    setNewClusterDesc('');
    setNewClusterColor('#f59e0b');
  };

  const handleEditClick = (cluster: PasswordCluster) => {
    setEditingClusterId(cluster.id);
    setNewClusterLabel(cluster.label);
    setNewClusterColor(cluster.color);
    setNewClusterDesc(cluster.description || '');
  };

  const handleDeleteCluster = (clusterId: string) => {
    if (confirm('Delete this password cluster? All member accounts will be converted to Unique Passwords.')) {
      onUpdateClusters(clusters.filter((c) => c.id !== clusterId));
      onUpdateAccounts(
        accounts.map((a) =>
          a.passwordClusterId === clusterId
            ? { ...a, passwordClusterId: `cluster_unique_${a.id}` }
            : a
        )
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Lock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Zero-Knowledge Password Reuse Clusters</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Organize accounts that share the same master password. No plaintext passwords or hashes are ever collected.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <form onSubmit={handleCreateCluster} className="glass-panel" style={{ padding: '18px 20px', marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: 12 }}>
              {editingClusterId ? 'Edit Password Group' : 'Create New Password Group'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Cluster Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Work SSO Password, Old 2018 Password"
                  className="form-control"
                  value={newClusterLabel}
                  onChange={(e) => setNewClusterLabel(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Badge Color</label>
                <input
                  type="color"
                  className="form-control"
                  style={{ height: '42px', padding: '4px', cursor: 'pointer' }}
                  value={newClusterColor}
                  onChange={(e) => setNewClusterColor(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Description / Notes</label>
              <input
                type="text"
                placeholder="e.g. Used for gaming forums and non-essential portals"
                className="form-control"
                value={newClusterDesc}
                onChange={(e) => setNewClusterDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {editingClusterId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingClusterId(null);
                    setNewClusterLabel('');
                    setNewClusterDesc('');
                  }}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-primary btn-sm">
                <Plus size={14} /> {editingClusterId ? 'Save Cluster' : 'Create Cluster'}
              </button>
            </div>
          </form>

          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: 12 }}>Existing Password Groups ({clusters.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clusters.map((cluster) => {
                const count = clusterMemberCounts.get(cluster.id) || 0;
                const isReused = count > 1;

                return (
                  <div
                    key={cluster.id}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: cluster.color,
                          display: 'inline-block',
                          boxShadow: `0 0 8px ${cluster.color}`,
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {cluster.label}
                          {isReused ? (
                            <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
                              <ShieldAlert size={12} /> {count} Accounts Sharing (High Risk)
                            </span>
                          ) : (
                            <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>
                              <ShieldCheck size={12} /> {count} Account (Isolated)
                            </span>
                          )}
                        </div>
                        {cluster.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {cluster.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleEditClick(cluster)}
                        className="btn-secondary btn-sm"
                        title="Edit Cluster"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCluster(cluster.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                        }}
                        title="Delete Cluster"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
