import { ROLES } from '../auth/roles.js'

// Flow 7 — starting values for the Administration screens.
// The permission matrix mirrors what the route guards in src/App.jsx allow today.
// Editing it in the Admin screen is DEMO ONLY: the guards and services keep their own
// rules, so a change here never grants or removes real access.

export const PERMISSIONS = [
  'admin.dashboard',
  'audit.view',
  'users.manage',
  'vault.manage',
  'assignments.manage',
  'handover.start',
  'handover.receive',
  'legal.review',
  'notifications.view',
]

export const DEFAULT_ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['admin.dashboard', 'audit.view', 'users.manage', 'notifications.view'],
  [ROLES.VAULT_OWNER]: ['vault.manage', 'assignments.manage', 'notifications.view'],
  [ROLES.EXECUTOR]: ['handover.start', 'notifications.view'],
  [ROLES.BENEFICIARY]: ['handover.receive', 'notifications.view'],
  [ROLES.LEGAL_VERIFIER]: ['legal.review', 'notifications.view'],
}

// Permissions an Admin may not remove from ADMIN (otherwise nobody could undo it).
export const LOCKED_PERMISSIONS = { [ROLES.ADMIN]: ['admin.dashboard', 'users.manage'] }

export const DEFAULT_POLICIES = {
  encryptionAlgorithm: 'AES-256-GCM',
  keyRotationDays: 90,
  requireClientSideEncryption: true,
  backupFrequency: 'DAILY',
  backupRetentionDays: 30,
  backupRegion: 'ap-southeast-1',
}

export const POLICY_OPTIONS = {
  encryptionAlgorithm: ['AES-256-GCM', 'XChaCha20-Poly1305'],
  backupFrequency: ['HOURLY', 'DAILY', 'WEEKLY'],
  backupRegion: ['ap-southeast-1', 'eu-west-1', 'us-east-1'],
}

// No integration is connected; these are placeholders for the screen.
export const DEFAULT_INTEGRATIONS = [
  { id: 'email', name: 'E-mail provider', category: 'NOTIFICATION', enabled: false },
  { id: 'sms', name: 'SMS gateway', category: 'NOTIFICATION', enabled: false },
  { id: 'kyc', name: 'KYC / eKYC provider', category: 'IDENTITY', enabled: false },
  { id: 'storage', name: 'Cloud backup storage', category: 'BACKUP', enabled: false },
  { id: 'esign', name: 'Digital signature service', category: 'LEGAL', enabled: false },
]

export const USER_STATUS = { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED' }
