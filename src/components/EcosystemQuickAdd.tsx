import React from 'react';
import type { Account, PasswordCluster } from '../types/account';
import { Sparkles, Plus } from 'lucide-react';

interface EcosystemQuickAddProps {
  existingAccounts: Account[];
  clusters: PasswordCluster[];
  onAddAccounts: (accounts: Account[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const EcosystemQuickAdd: React.FC<EcosystemQuickAddProps> = ({
  existingAccounts,
  clusters,
  onAddAccounts,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const defaultClusterId = clusters[0]?.id || 'cluster_unique';

  const templates = [
    {
      id: 'google_ecosystem',
      name: 'Google Identity Hub & Ecosystem',
      description: 'Creates a Primary Gmail hub that recovers YouTube, Google Drive, and delegates SSO.',
      accountsCount: 3,
      accounts: [
        {
          name: 'Google Account (Gmail & Hub)',
          category: 'identity_email' as const,
          username: 'user.personal@gmail.com',
          method: 'direct' as const,
          has2FA: false,
          twoFactorType: 'none' as const,
          permissions: ['contacts' as const, 'photos_storage' as const, 'precise_location' as const],
          sensitivity: 10,
        },
        {
          name: 'Google Drive & Workspace',
          category: 'cloud_storage' as const,
          username: 'user.personal@gmail.com',
          method: 'google_sso' as const,
          has2FA: true,
          twoFactorType: 'authenticator_app' as const,
          permissions: ['photos_storage' as const],
          sensitivity: 8,
        },
        {
          name: 'YouTube & Creator Studio',
          category: 'entertainment_gaming' as const,
          username: 'user.personal@gmail.com',
          method: 'google_sso' as const,
          has2FA: false,
          twoFactorType: 'none' as const,
          permissions: ['camera' as const, 'microphone' as const],
          sensitivity: 5,
        },
      ],
    },
    {
      id: 'developer_stack',
      name: 'Developer & Cloud Stack',
      description: 'Creates GitHub repository hub, Vercel deployments, and AWS Cloud infra.',
      accountsCount: 3,
      accounts: [
        {
          name: 'GitHub Enterprise / Personal',
          category: 'work_dev' as const,
          username: 'developer-hub',
          method: 'direct' as const,
          has2FA: true,
          twoFactorType: 'authenticator_app' as const,
          permissions: ['photos_storage' as const],
          sensitivity: 9,
        },
        {
          name: 'Vercel Cloud Hosting',
          category: 'work_dev' as const,
          username: 'developer-hub',
          method: 'github_sso' as const,
          has2FA: true,
          twoFactorType: 'authenticator_app' as const,
          permissions: [],
          sensitivity: 8,
        },
        {
          name: 'AWS Cloud Console',
          category: 'cloud_storage' as const,
          username: 'root-admin-aws',
          method: 'direct' as const,
          has2FA: true,
          twoFactorType: 'hardware_key' as const,
          permissions: [],
          sensitivity: 10,
        },
      ],
    },
    {
      id: 'social_media_pack',
      name: 'Social Media & Content Pack',
      description: 'Creates Instagram, TikTok, and Discord accounts with realistic hardware permission configurations.',
      accountsCount: 3,
      accounts: [
        {
          name: 'Instagram Social App',
          category: 'social_media' as const,
          username: '@creator_handle',
          method: 'direct' as const,
          has2FA: false,
          twoFactorType: 'none' as const,
          permissions: ['camera' as const, 'photos_storage' as const, 'precise_location' as const, 'contacts' as const],
          sensitivity: 6,
        },
        {
          name: 'TikTok Video Portal',
          category: 'social_media' as const,
          username: '@creator_handle',
          method: 'direct' as const,
          has2FA: false,
          twoFactorType: 'none' as const,
          permissions: ['camera' as const, 'microphone' as const, 'photos_storage' as const, 'background_tracking' as const],
          sensitivity: 5,
        },
        {
          name: 'Discord Community Server',
          category: 'social_media' as const,
          username: 'creator#0001',
          method: 'direct' as const,
          has2FA: true,
          twoFactorType: 'authenticator_app' as const,
          permissions: ['microphone' as const],
          sensitivity: 5,
        },
      ],
    },
  ];

  const handleApplyTemplate = (template: typeof templates[0]) => {
    const time = Date.now();
    const newCreated: Account[] = [];

    const primaryHub = existingAccounts.find((a) => a.serviceCategory === 'identity_email') || null;

    let parentId: string | undefined = undefined;

    template.accounts.forEach((tAcc, i) => {
      const accId = `acc_tmpl_${time}_${i}`;
      if (i === 0) parentId = accId;

      const account: Account = {
        id: accId,
        name: tAcc.name,
        serviceCategory: tAcc.category,
        usernameOrEmail: tAcc.username,
        signInMethod: tAcc.method,
        ssoParentId: tAcc.method !== 'direct' ? parentId : undefined,
        recoveryEmailAccountId: primaryHub ? primaryHub.id : undefined,
        has2FA: tAcc.has2FA,
        twoFactorType: tAcc.twoFactorType,
        passwordClusterId: defaultClusterId,
        permissions: tAcc.permissions,
        knownBreachesCount: 0,
        sensitivityWeight: tAcc.sensitivity,
        lastActivityDate: new Date().toISOString().split('T')[0],
        notes: `Imported from ${template.name} template.`,
      };

      newCreated.push(account);
    });

    onAddAccounts([...existingAccounts, ...newCreated]);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '740px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Quick-Add Ecosystem Templates</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Rapidly ingest linked account bundles with pre-configured SSO relationships and permissions.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="glass-panel"
              style={{
                padding: '18px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h4 style={{ fontSize: '1rem', color: '#fff' }}>{tmpl.name}</h4>
                  <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                    +{tmpl.accountsCount} Accounts
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {tmpl.description}
                </p>
              </div>

              <button
                onClick={() => handleApplyTemplate(tmpl)}
                className="btn-primary btn-sm"
                style={{ whiteSpace: 'nowrap' }}
              >
                <Plus size={14} /> Ingest Bundle
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
