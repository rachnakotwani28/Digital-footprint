export type ServiceCategory =
  | 'identity_email'
  | 'financial'
  | 'cloud_storage'
  | 'social_media'
  | 'work_dev'
  | 'entertainment_gaming'
  | 'shopping'
  | 'utility_apps';

export type TwoFactorType = 'none' | 'sms' | 'authenticator_app' | 'hardware_key';

export type SignInMethod = 'direct' | 'google_sso' | 'apple_sso' | 'github_sso' | 'microsoft_sso';

export type AppPermission =
  | 'camera'
  | 'microphone'
  | 'precise_location'
  | 'contacts'
  | 'photos_storage'
  | 'financial_data'
  | 'background_tracking';

export interface PermissionDefinition {
  id: AppPermission;
  label: string;
  iconName: string;
  riskWeight: number; // 0 to 10
  description: string;
}

export interface PasswordCluster {
  id: string;
  label: string;
  color: string;
  description?: string;
}

export interface Account {
  id: string;
  name: string;
  serviceCategory: ServiceCategory;
  usernameOrEmail: string;
  signInMethod: SignInMethod;
  ssoParentId?: string; // Account id of the provider (e.g. Google)
  recoveryEmailAccountId?: string; // Account id that receives recovery emails
  recoveryPhone?: string;
  has2FA: boolean;
  twoFactorType: TwoFactorType;
  passwordClusterId: string; // Zero-knowledge grouping label (e.g. 'cluster_master', 'cluster_legacy', 'cluster_unique_1')
  permissions: AppPermission[];
  knownBreachesCount: number;
  lastBreachDate?: string;
  sensitivityWeight: number; // 1 to 10 (Finance = 10, Primary Email = 10, Forum = 2)
  lastActivityDate: string; // ISO date string
  isDecommissioned?: boolean;
  notes?: string;
}
