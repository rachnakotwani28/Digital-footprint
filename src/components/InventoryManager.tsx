import React, { useState, useMemo, useRef } from 'react';
import type { Account, AppPermission, PasswordCluster, ServiceCategory, TwoFactorType, SignInMethod } from '../types/account';
import type { ExposureNetwork } from '../types/graph';
import { PERMISSION_DEFINITIONS } from '../services/seedData';
import { PasswordClusterManager } from './PasswordClusterManager';
import { EcosystemQuickAdd } from './EcosystemQuickAdd';
import { 
  Search, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Filter, 
  Sparkles, 
  Upload, 
  Key, 
  ArrowUpDown, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

interface InventoryManagerProps {
  accounts: Account[];
  clusters: PasswordCluster[];
  network: ExposureNetwork;
  onUpdateAccounts: (accounts: Account[]) => void;
  onUpdateClusters: (clusters: PasswordCluster[]) => void;
  onSelectNode: (nodeId: string | null) => void;
}

type SortField = 'risk_desc' | 'risk_asc' | 'blast_radius' | 'name' | 'last_activity';

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  accounts,
  clusters,
  network,
  onUpdateAccounts,
  onUpdateClusters,
  onSelectNode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRiskTier, setSelectedRiskTier] = useState<string>('ALL');
  const [filterMissing2FA, setFilterMissing2FA] = useState(false);
  const [filterPasswordReuse, setFilterPasswordReuse] = useState(false);
  const [filterSPOFOnly, setFilterSPOFOnly] = useState(false);
  const [filterBreachesOnly, setFilterBreachesOnly] = useState(false);
  const [filterPermission, setFilterPermission] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('risk_desc');

  // Sub-modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClusterModalOpen, setIsClusterModalOpen] = useState(false);
  const [isEcosystemModalOpen, setIsEcosystemModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ServiceCategory>('cloud_storage');
  const [formUsername, setFormUsername] = useState('');
  const [formSignInMethod, setFormSignInMethod] = useState<SignInMethod>('direct');
  const [formSsoParentId, setFormSsoParentId] = useState<string>('');
  const [formRecoveryEmailId, setFormRecoveryEmailId] = useState<string>('');
  const [formHas2FA, setFormHas2FA] = useState(false);
  const [form2FAType, setForm2FAType] = useState<TwoFactorType>('none');
  const [formClusterId, setFormClusterId] = useState<string>(clusters[0]?.id || 'cluster_unique');
  const [formPermissions, setFormPermissions] = useState<AppPermission[]>([]);
  const [formSensitivity, setFormSensitivity] = useState<number>(7);
  const [formBreaches, setFormBreaches] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');

  const nodeMap = useMemo(() => {
    const map = new Map<string, typeof network.nodes[0]>();
    network.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [network]);

  const clusterMap = useMemo(() => {
    const map = new Map<string, PasswordCluster>();
    clusters.forEach((c) => map.set(c.id, c));
    return map;
  }, [clusters]);

  // Filtering & Sorting (Requirement 4: Search and filters)
  const filteredAccounts = useMemo(() => {
    const list = accounts.filter((acc) => {
      const node = nodeMap.get(acc.id);
      const riskTier = node?.riskTier || 'moderate';
      const isSPOF = node?.isSPOF || false;

      // 1. Text Search across name, email, notes, category
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesUser = acc.usernameOrEmail.toLowerCase().includes(q);
        const matchesNotes = (acc.notes || '').toLowerCase().includes(q);
        const matchesCategory = acc.serviceCategory.toLowerCase().includes(q);
        if (!matchesName && !matchesUser && !matchesNotes && !matchesCategory) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL' && acc.serviceCategory !== selectedCategory) {
        return false;
      }

      // 3. Risk Tier Filter
      if (selectedRiskTier !== 'ALL' && riskTier !== selectedRiskTier) {
        return false;
      }

      // 4. Missing 2FA Filter
      if (filterMissing2FA && acc.has2FA) {
        return false;
      }

      // 5. Password Reuse Filter
      if (filterPasswordReuse && (acc.passwordClusterId.includes('unique') || !acc.passwordClusterId)) {
        return false;
      }

      // 6. SPOF Filter
      if (filterSPOFOnly && !isSPOF) {
        return false;
      }

      // 7. Known Breaches Filter
      if (filterBreachesOnly && acc.knownBreachesCount === 0) {
        return false;
      }

      // 8. Permission Filter
      if (filterPermission !== 'ALL' && !acc.permissions.includes(filterPermission as AppPermission)) {
        return false;
      }

      return true;
    });

    // Sort accounts
    return list.sort((a, b) => {
      const nodeA = nodeMap.get(a.id);
      const nodeB = nodeMap.get(b.id);
      const riskA = nodeA?.effectiveRisk || 50;
      const riskB = nodeB?.effectiveRisk || 50;
      const blastA = nodeA?.downstreamBlastRadiusCount || 0;
      const blastB = nodeB?.downstreamBlastRadiusCount || 0;

      switch (sortField) {
        case 'risk_desc':
          return riskB - riskA;
        case 'risk_asc':
          return riskA - riskB;
        case 'blast_radius':
          return blastB - blastA;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'last_activity':
          return new Date(a.lastActivityDate).getTime() - new Date(b.lastActivityDate).getTime();
        default:
          return riskB - riskA;
      }
    });
  }, [
    accounts,
    nodeMap,
    searchQuery,
    selectedCategory,
    selectedRiskTier,
    filterMissing2FA,
    filterPasswordReuse,
    filterSPOFOnly,
    filterBreachesOnly,
    filterPermission,
    sortField,
  ]);

  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setFormName('');
    setFormCategory('cloud_storage');
    setFormUsername('');
    setFormSignInMethod('direct');
    setFormSsoParentId('');
    setFormRecoveryEmailId('');
    setFormHas2FA(false);
    setForm2FAType('none');
    setFormClusterId(clusters[0]?.id || 'cluster_unique');
    setFormPermissions([]);
    setFormSensitivity(7);
    setFormBreaches(0);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setFormName(acc.name);
    setFormCategory(acc.serviceCategory);
    setFormUsername(acc.usernameOrEmail);
    setFormSignInMethod(acc.signInMethod);
    setFormSsoParentId(acc.ssoParentId || '');
    setFormRecoveryEmailId(acc.recoveryEmailAccountId || '');
    setFormHas2FA(acc.has2FA);
    setForm2FAType(acc.twoFactorType);
    setFormClusterId(acc.passwordClusterId);
    setFormPermissions([...acc.permissions]);
    setFormSensitivity(acc.sensitivityWeight);
    setFormBreaches(acc.knownBreachesCount);
    setFormNotes(acc.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const updatedAccount: Account = {
      id: editingAccount ? editingAccount.id : `acc_${Date.now()}`,
      name: formName.trim(),
      serviceCategory: formCategory,
      usernameOrEmail: formUsername.trim() || 'user@privacy.local',
      signInMethod: formSignInMethod,
      ssoParentId: formSignInMethod !== 'direct' ? formSsoParentId || undefined : undefined,
      recoveryEmailAccountId: formRecoveryEmailId || undefined,
      has2FA: formHas2FA,
      twoFactorType: formHas2FA ? form2FAType : 'none',
      passwordClusterId: formClusterId,
      permissions: formPermissions,
      knownBreachesCount: Number(formBreaches) || 0,
      sensitivityWeight: Number(formSensitivity) || 5,
      lastActivityDate: editingAccount ? editingAccount.lastActivityDate : new Date().toISOString().split('T')[0],
      notes: formNotes.trim(),
    };

    if (editingAccount) {
      onUpdateAccounts(accounts.map((a) => (a.id === editingAccount.id ? updatedAccount : a)));
    } else {
      onUpdateAccounts([...accounts, updatedAccount]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteAccount = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this account from your digital footprint inventory?')) {
      onUpdateAccounts(accounts.filter((a) => a.id !== id));
    }
  };

  const togglePermission = (perm: AppPermission) => {
    if (formPermissions.includes(perm)) {
      setFormPermissions(formPermissions.filter((p) => p !== perm));
    } else {
      setFormPermissions([...formPermissions, perm]);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Account Name', 'Category', 'Username / Email', '2FA Status', 'Password Group', 'Risk Score', 'Risk Tier', 'Permissions'];
    const rows = filteredAccounts.map((acc) => {
      const node = nodeMap.get(acc.id);
      return [
        `"${acc.name.replace(/"/g, '""')}"`,
        acc.serviceCategory,
        `"${acc.usernameOrEmail}"`,
        acc.has2FA ? acc.twoFactorType : 'NONE',
        `"${acc.passwordClusterId}"`,
        node?.effectiveRisk || 50,
        node?.riskTier || 'moderate',
        `"${acc.permissions.join('; ')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `digital-footprint-inventory-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.accounts && Array.isArray(parsed.accounts)) {
          onUpdateAccounts(parsed.accounts);
          alert(`Successfully imported ${parsed.accounts.length} accounts into footprint!`);
        } else if (Array.isArray(parsed)) {
          onUpdateAccounts(parsed);
          alert(`Successfully imported ${parsed.length} accounts!`);
        } else {
          alert('Invalid format. JSON must contain an accounts array.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Search & Action Toolbar */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '420px' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search accounts, usernames, emails, categories, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setIsClusterModalOpen(true)} className="btn-secondary btn-sm">
              <Key size={14} style={{ color: '#f59e0b' }} /> Password Groups
            </button>
            <button onClick={() => setIsEcosystemModalOpen(true)} className="btn-secondary btn-sm">
              <Sparkles size={14} style={{ color: 'var(--accent-cyan)' }} /> Quick-Add Ecosystems
            </button>
            <button onClick={handleExportCsv} className="btn-secondary btn-sm" title="Export Inventory to CSV Spreadsheet">
              <FileSpreadsheet size={14} /> Export CSV
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportJson}
            />
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary btn-sm" title="Import Footprint JSON">
              <Upload size={14} /> Import JSON
            </button>
            <button onClick={handleOpenAddModal} className="btn-primary btn-sm">
              <Plus size={16} /> Add Account
            </button>
          </div>
        </div>

        {/* Multi-Facet Filter Pills & Sorting */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={14} /> Filter By:
          </span>

          <select
            className="form-control"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
            value={selectedRiskTier}
            onChange={(e) => setSelectedRiskTier(e.target.value)}
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="critical">Critical (Score ≥ 75)</option>
            <option value="high">High (Score 50-74)</option>
            <option value="moderate">Moderate (Score 25-49)</option>
            <option value="low">Low / Safe (Score &lt; 25)</option>
          </select>

          <select
            className="form-control"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="identity_email">Identity & Email Hubs</option>
            <option value="financial">Financial & Banking</option>
            <option value="cloud_storage">Cloud Storage & Docs</option>
            <option value="work_dev">Developer & Work</option>
            <option value="social_media">Social Networks</option>
            <option value="shopping">E-Commerce & Shopping</option>
            <option value="entertainment_gaming">Gaming & Streaming</option>
            <option value="utility_apps">Utility & Mobile Apps</option>
          </select>

          <select
            className="form-control"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
            value={filterPermission}
            onChange={(e) => setFilterPermission(e.target.value)}
          >
            <option value="ALL">Any Permissions</option>
            {Object.values(PERMISSION_DEFINITIONS).map((def) => (
              <option key={def.id} value={def.id}>
                Has {def.label}
              </option>
            ))}
          </select>

          {/* Quick Filter Toggles */}
          <button
            onClick={() => setFilterMissing2FA(!filterMissing2FA)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: filterMissing2FA ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
              background: filterMissing2FA ? 'rgba(239, 68, 68, 0.18)' : 'transparent',
              color: filterMissing2FA ? '#fca5a5' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Missing 2FA
          </button>

          <button
            onClick={() => setFilterPasswordReuse(!filterPasswordReuse)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: filterPasswordReuse ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
              background: filterPasswordReuse ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
              color: filterPasswordReuse ? '#fcd34d' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Shared Password
          </button>

          <button
            onClick={() => setFilterSPOFOnly(!filterSPOFOnly)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: filterSPOFOnly ? '1px solid #f43f5e' : '1px solid var(--border-subtle)',
              background: filterSPOFOnly ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
              color: filterSPOFOnly ? '#fda4af' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> SPOF Only
          </button>

          <button
            onClick={() => setFilterBreachesOnly(!filterBreachesOnly)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: filterBreachesOnly ? '1px solid #f43f5e' : '1px solid var(--border-subtle)',
              background: filterBreachesOnly ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
              color: filterBreachesOnly ? '#fda4af' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Known Breaches
          </button>

          {/* Sort Selector */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpDown size={14} /> Sort:
            </span>
            <select
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
            >
              <option value="risk_desc">Highest Risk First</option>
              <option value="risk_asc">Lowest Risk First</option>
              <option value="blast_radius">Largest Blast Radius</option>
              <option value="name">Account Name (A-Z)</option>
              <option value="last_activity">Least Recently Active</option>
            </select>
          </div>

          {(selectedCategory !== 'ALL' || selectedRiskTier !== 'ALL' || filterMissing2FA || filterPasswordReuse || filterSPOFOnly || filterBreachesOnly || filterPermission !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedRiskTier('ALL');
                setFilterMissing2FA(false);
                setFilterPasswordReuse(false);
                setFilterSPOFOnly(false);
                setFilterBreachesOnly(false);
                setFilterPermission('ALL');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Accounts Inventory Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Accounts & Apps Inventory ({filteredAccounts.length} of {accounts.length})</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Zero-knowledge inventory: no plaintext passwords, only relationship and risk mappings.</p>
          </div>
        </div>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Account / Service</th>
                <th>Authentication & 2FA</th>
                <th>Password Cluster (Zero-Knowledge)</th>
                <th>Connections & Recovery</th>
                <th>Permissions Granted</th>
                <th>Effective Risk</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No accounts found matching your selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const node = nodeMap.get(acc.id);
                  const effectiveRisk = node?.effectiveRisk || 50;
                  const baseRisk = node?.baseRisk || 50;
                  const isSPOF = node?.isSPOF;
                  const cluster = clusterMap.get(acc.passwordClusterId);
                  const isSharedPwd = acc.passwordClusterId && !acc.passwordClusterId.includes('unique');

                  const ssoParent = acc.ssoParentId ? accounts.find((a) => a.id === acc.ssoParentId) : null;
                  const recoveryAcc = acc.recoveryEmailAccountId ? accounts.find((a) => a.id === acc.recoveryEmailAccountId) : null;

                  return (
                    <tr
                      key={acc.id}
                      onClick={() => onSelectNode(acc.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {acc.name}
                              {isSPOF && (
                                <span className="badge badge-spof" style={{ fontSize: '0.65rem' }}>
                                  SPOF
                                </span>
                              )}
                              {acc.knownBreachesCount > 0 && (
                                <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                                  {acc.knownBreachesCount} Breaches
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {acc.usernameOrEmail} • <span style={{ textTransform: 'capitalize' }}>{acc.serviceCategory.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {acc.has2FA ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: '0.8rem', fontWeight: 500 }}>
                            <ShieldCheck size={16} />
                            <span>
                              {acc.twoFactorType === 'hardware_key'
                                ? 'Hardware Token'
                                : acc.twoFactorType === 'authenticator_app'
                                ? 'Authenticator'
                                : 'SMS Verified'}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f43f5e', fontSize: '0.8rem', fontWeight: 600 }}>
                            <ShieldAlert size={16} />
                            <span>No 2FA</span>
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: isSharedPwd ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: isSharedPwd ? '#fca5a5' : '#6ee7b7',
                            border: `1px solid ${isSharedPwd ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                          }}
                        >
                          <Lock size={12} />
                          {cluster?.label || (isSharedPwd ? 'Shared Password Group' : 'Unique Password')}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {ssoParent && (
                            <span style={{ color: '#38bdf8' }}>
                              SSO via <strong>{ssoParent.name}</strong>
                            </span>
                          )}
                          {recoveryAcc && (
                            <span style={{ color: '#fbbf24' }}>
                              Recovered by <strong>{recoveryAcc.name}</strong>
                            </span>
                          )}
                          {!ssoParent && !recoveryAcc && (
                            <span style={{ color: 'var(--text-muted)' }}>Standalone / Direct</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: '240px' }}>
                          {acc.permissions.length === 0 ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None</span>
                          ) : (
                            acc.permissions.map((p) => {
                              const isHighRisk = ['camera', 'microphone', 'precise_location', 'background_tracking'].includes(p);
                              return (
                                <span
                                  key={p}
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: isHighRisk ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                    color: isHighRisk ? '#fca5a5' : 'var(--text-secondary)',
                                    border: isHighRisk ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-subtle)',
                                    textTransform: 'capitalize',
                                  }}
                                >
                                  {p.replace('_', ' ')}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            className={`badge badge-${node?.riskTier || 'moderate'}`}
                            style={{ fontSize: '0.8rem', minWidth: '42px', justifyContent: 'center' }}
                          >
                            {effectiveRisk}
                          </span>
                          {effectiveRisk > baseRisk && (
                            <span style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 600 }}>
                              (+{effectiveRisk - baseRisk} cascade)
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(acc);
                            }}
                            className="btn-secondary btn-sm"
                            title="Edit Account Details"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDeleteAccount(acc.id, e)}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)',
                              padding: '5px 8px',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                            }}
                            title="Delete Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Account Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem' }}>{editingAccount ? 'Edit Account' : 'Add Account to Footprint'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveAccount} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Service / App Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Google, Chase Bank, Discord"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Service Category</label>
                  <select
                    className="form-control"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ServiceCategory)}
                  >
                    <option value="identity_email">Identity & Email Hub</option>
                    <option value="financial">Financial & Banking</option>
                    <option value="cloud_storage">Cloud Storage & Docs</option>
                    <option value="work_dev">Developer & Work</option>
                    <option value="social_media">Social Media</option>
                    <option value="shopping">Shopping & E-Commerce</option>
                    <option value="entertainment_gaming">Gaming & Entertainment</option>
                    <option value="utility_apps">Utility & Mobile Apps</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Username / Handle / Email Mask</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. user@gmail.com or @alex"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sign-In Method</label>
                  <select
                    className="form-control"
                    value={formSignInMethod}
                    onChange={(e) => setFormSignInMethod(e.target.value as SignInMethod)}
                  >
                    <option value="direct">Direct Password / Credentials</option>
                    <option value="google_sso">Sign in with Google SSO</option>
                    <option value="apple_sso">Sign in with Apple SSO</option>
                    <option value="github_sso">Sign in with GitHub SSO</option>
                    <option value="microsoft_sso">Sign in with Microsoft SSO</option>
                  </select>
                </div>
              </div>

              {formSignInMethod !== 'direct' && (
                <div className="form-group" style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <label className="form-label" style={{ color: '#38bdf8' }}>Linked SSO Identity Provider Account</label>
                  <select
                    className="form-control"
                    value={formSsoParentId}
                    onChange={(e) => setFormSsoParentId(e.target.value)}
                  >
                    <option value="">Select identity provider account...</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.usernameOrEmail})
                      </option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginTop: 4 }}>
                    If this provider is breached, the attacker gains direct SSO entry to this account.
                  </small>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Recovery Email Account (Resets Password)</label>
                <select
                  className="form-control"
                  value={formRecoveryEmailId}
                  onChange={(e) => setFormRecoveryEmailId(e.target.value)}
                >
                  <option value="">None / Standalone phone only</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.usernameOrEmail})
                    </option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginTop: 4 }}>
                  Whoever controls this recovery inbox can reset this account's credentials.
                </small>
              </div>

              <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Password Reuse Cluster (Zero-Knowledge Tag)</span>
                  <span style={{ fontSize: '0.72rem', color: '#10b981' }}>✓ No real passwords stored</span>
                </label>
                <select
                  className="form-control"
                  value={formClusterId}
                  onChange={(e) => setFormClusterId(e.target.value)}
                >
                  <option value="cluster_unique_custom">Unique Password (Not shared with any account)</option>
                  {clusters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Two-Factor Authentication (2FA)</label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setFormHas2FA(true);
                        if (form2FAType === 'none') setForm2FAType('authenticator_app');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 'var(--radius-md)',
                        border: formHas2FA ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                        background: formHas2FA ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                        color: formHas2FA ? '#6ee7b7' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      Enabled
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormHas2FA(false);
                        setForm2FAType('none');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 'var(--radius-md)',
                        border: !formHas2FA ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                        background: !formHas2FA ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                        color: !formHas2FA ? '#fca5a5' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      Missing / Disabled
                    </button>
                  </div>
                </div>

                {formHas2FA && (
                  <div className="form-group">
                    <label className="form-label">2FA Method Type</label>
                    <select
                      className="form-control"
                      value={form2FAType}
                      onChange={(e) => setForm2FAType(e.target.value as TwoFactorType)}
                    >
                      <option value="authenticator_app">Authenticator App (TOTP)</option>
                      <option value="hardware_key">Hardware Key (YubiKey/FIDO2)</option>
                      <option value="sms">SMS Text Verification (Vulnerable)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">App Permissions Granted (Hardware & Data)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 6 }}>
                  {Object.values(PERMISSION_DEFINITIONS).map((def) => {
                    const isChecked = formPermissions.includes(def.id);
                    return (
                      <div
                        key={def.id}
                        onClick={() => togglePermission(def.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          background: isChecked ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          border: isChecked ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 500, color: isChecked ? '#fff' : 'var(--text-secondary)' }}>
                            {def.label}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Risk Weight: {def.riskWeight}/10
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Asset Sensitivity Rating (1 to 10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formSensitivity}
                    onChange={(e) => setFormSensitivity(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>1 (Disposable Forum)</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>Level {formSensitivity}</strong>
                    <span>10 (Primary Bank / Email)</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Known Past Data Breaches Count</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="form-control"
                    value={formBreaches}
                    onChange={(e) => setFormBreaches(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingAccount ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Cluster Manager Modal */}
      <PasswordClusterManager
        clusters={clusters}
        accounts={accounts}
        onUpdateClusters={onUpdateClusters}
        onUpdateAccounts={onUpdateAccounts}
        isOpen={isClusterModalOpen}
        onClose={() => setIsClusterModalOpen(false)}
      />

      {/* Quick-Add Ecosystem Modal */}
      <EcosystemQuickAdd
        existingAccounts={accounts}
        clusters={clusters}
        onAddAccounts={onUpdateAccounts}
        isOpen={isEcosystemModalOpen}
        onClose={() => setIsEcosystemModalOpen(false)}
      />
    </div>
  );
};
