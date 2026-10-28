import { AdminError } from '../admin/AdminError.js'
import {
  DEFAULT_INTEGRATIONS,
  DEFAULT_POLICIES,
  DEFAULT_ROLE_PERMISSIONS,
  LOCKED_PERMISSIONS,
  PERMISSIONS,
  POLICY_OPTIONS,
  USER_STATUS,
} from '../admin/adminDefaults.js'
import { AUDIT_ACTIONS as A, OUTCOME, SEVERITY } from '../audit/auditRules.js'
import { ROLES, isKnownRole } from '../auth/roles.js'
import { createDemoStorage } from './demoStorage.js'
import { resetAudit } from './mockAuditStore.js'
import { mockResetHandovers } from './mockHandoverStore.js'
import { resetNotifications } from './mockNotificationStore.js'
import { emitSystemEvent } from './mockSystemEvents.js'
import { mockUsers } from './mockUsers.js'

// DEMO ONLY — Administration (Flow 7).
// Changes are saved in this browser and are audited + notified like real ones, BUT they do
// not change sign-in (mockAuth.js), route guards (App.jsx) or any security infrastructure:
// no key is rotated, no backup runs and no third-party service is called.
// Every function checks the ADMIN role itself, so a hidden button is never the only guard.

const storage = createDemoStorage('legacyvault-demo-admin')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const copy = (value) => structuredClone(value)

function load() {
  const saved = storage.get() ?? {}
  return {
    users: saved.users ?? {}, // userId → { role, status } overrides
    permissions: saved.permissions ?? copy(DEFAULT_ROLE_PERMISSIONS),
    policies: { ...DEFAULT_POLICIES, ...(saved.policies ?? {}) },
    integrations: DEFAULT_INTEGRATIONS.map((item) => ({ ...item, ...(saved.integrations?.[item.id] ?? {}) })),
  }
}

function save(state) {
  storage.set({
    users: state.users,
    permissions: state.permissions,
    policies: state.policies,
    integrations: Object.fromEntries(state.integrations.map(({ id, enabled }) => [id, { enabled }])),
  })
}

function requireAdmin(user, action) {
  if (!user) throw new AdminError('NOT_SIGNED_IN')
  if (user.role !== ROLES.ADMIN) {
    emitSystemEvent({ user, action, outcome: OUTCOME.DENIED, severity: SEVERITY.WARNING,
      entity: { type: 'ADMIN', id: action }, details: { reason: 'ADMIN_ONLY' } })
    throw new AdminError('ADMIN_ONLY')
  }
}

function listUsers(state) {
  return mockUsers.map((account) => ({
    id: account.id,
    fullName: account.fullName,
    identifier: account.identifier,
    role: state.users[account.id]?.role ?? account.role,
    originalRole: account.role,
    status: state.users[account.id]?.status ?? USER_STATUS.ACTIVE,
  }))
}

// ---------------- Users ----------------

export async function mockAdminListUsers(user) {
  await delay(200)
  requireAdmin(user, A.ADMIN_ACCESS)
  return listUsers(load())
}

export async function mockAdminSetUserStatus(user, userId, status) {
  await delay(300)
  requireAdmin(user, A.USER_STATUS_CHANGED)
  if (!Object.values(USER_STATUS).includes(status)) throw new AdminError('INVALID_INPUT')
  if (userId === user.id) throw new AdminError('SELF_CHANGE')
  const state = load()
  const target = listUsers(state).find((item) => item.id === userId)
  if (!target) throw new AdminError('NOT_FOUND')
  if (target.status === status) return target

  state.users[userId] = { ...state.users[userId], status }
  save(state)
  emitSystemEvent({
    user, action: A.USER_STATUS_CHANGED, entity: { type: 'USER', id: userId },
    severity: status === USER_STATUS.SUSPENDED ? SEVERITY.WARNING : SEVERITY.INFO,
    details: { from: target.status, to: status },
    notify: [{ userId, type: 'ACCOUNT_STATUS_CHANGED', params: { status } }],
  })
  return listUsers(state).find((item) => item.id === userId)
}

export async function mockAdminSetUserRole(user, userId, role) {
  await delay(300)
  requireAdmin(user, A.USER_ROLE_CHANGED)
  if (!isKnownRole(role)) throw new AdminError('INVALID_INPUT')
  if (userId === user.id) throw new AdminError('SELF_CHANGE')
  const state = load()
  const target = listUsers(state).find((item) => item.id === userId)
  if (!target) throw new AdminError('NOT_FOUND')
  if (target.role === role) return target

  state.users[userId] = { ...state.users[userId], role }
  save(state)
  emitSystemEvent({
    user, action: A.USER_ROLE_CHANGED, entity: { type: 'USER', id: userId }, severity: SEVERITY.WARNING,
    details: { from: target.role, to: role },
    notify: [{ userId, type: 'ACCOUNT_ROLE_CHANGED', params: { role } }],
  })
  return listUsers(state).find((item) => item.id === userId)
}

// ---------------- Roles / permissions ----------------

export async function mockAdminGetPermissions(user) {
  await delay(150)
  requireAdmin(user, A.ADMIN_ACCESS)
  return { permissions: PERMISSIONS, matrix: load().permissions, locked: LOCKED_PERMISSIONS }
}

export async function mockAdminSetPermission(user, role, permission, granted) {
  await delay(250)
  requireAdmin(user, A.PERMISSION_CHANGED)
  if (!isKnownRole(role) || !PERMISSIONS.includes(permission)) throw new AdminError('INVALID_INPUT')
  if (!granted && LOCKED_PERMISSIONS[role]?.includes(permission)) throw new AdminError('LOCKED_PERMISSION')
  const state = load()
  const current = new Set(state.permissions[role] ?? [])
  if (current.has(permission) === granted) return state.permissions
  if (granted) current.add(permission)
  else current.delete(permission)
  state.permissions[role] = PERMISSIONS.filter((item) => current.has(item))
  save(state)

  // Everyone who currently has this role is told about the change.
  const affected = listUsers(state).filter((item) => item.role === role && item.id !== user.id)
  emitSystemEvent({
    user, action: A.PERMISSION_CHANGED, entity: { type: 'ROLE', id: role }, severity: SEVERITY.WARNING,
    details: { permission, granted },
    notify: affected.map((item) => ({ userId: item.id, type: 'PERMISSIONS_CHANGED', params: { role, permission, granted } })),
  })
  return state.permissions
}

// ---------------- Encryption / backup / DMS policies ----------------

export async function mockAdminGetPolicies(user) {
  await delay(150)
  requireAdmin(user, A.ADMIN_ACCESS)
  return { policies: load().policies, options: POLICY_OPTIONS }
}

export async function mockAdminSavePolicies(user, policies) {
  await delay(400)
  requireAdmin(user, A.POLICY_CHANGED)
  const next = { ...DEFAULT_POLICIES, ...policies }
  const days = (value, min, max) => Number.isInteger(value) && value >= min && value <= max
  const valid =
    POLICY_OPTIONS.encryptionAlgorithm.includes(next.encryptionAlgorithm) &&
    POLICY_OPTIONS.backupFrequency.includes(next.backupFrequency) &&
    POLICY_OPTIONS.backupRegion.includes(next.backupRegion) &&
    days(next.keyRotationDays, 7, 365) &&
    days(next.backupRetentionDays, 1, 3650) &&
    days(next.dmsDefaultIntervalDays, 7, 365) &&
    days(next.dmsDefaultGraceDays, 1, 90) &&
    days(next.dmsMaxReminders, 1, 10) &&
    typeof next.requireClientSideEncryption === 'boolean'
  if (!valid) throw new AdminError('INVALID_INPUT')

  const state = load()
  const changed = Object.keys(DEFAULT_POLICIES).filter((key) => state.policies[key] !== next[key])
  if (!changed.length) return state.policies
  state.policies = next
  save(state)
  emitSystemEvent({
    user, action: A.POLICY_CHANGED, entity: { type: 'POLICY', id: 'encryption-backup' },
    severity: next.requireClientSideEncryption ? SEVERITY.INFO : SEVERITY.WARNING,
    details: { changed },
  })
  return state.policies
}

// ---------------- Third-party integrations ----------------

export async function mockAdminListIntegrations(user) {
  await delay(150)
  requireAdmin(user, A.ADMIN_ACCESS)
  return load().integrations
}

export async function mockAdminSetIntegration(user, id, enabled) {
  await delay(300)
  requireAdmin(user, A.INTEGRATION_CHANGED)
  const state = load()
  const item = state.integrations.find((entry) => entry.id === id)
  if (!item) throw new AdminError('NOT_FOUND')
  if (item.enabled === enabled) return state.integrations
  item.enabled = enabled
  save(state)
  emitSystemEvent({ user, action: A.INTEGRATION_CHANGED, entity: { type: 'INTEGRATION', id }, details: { enabled } })
  return state.integrations
}

// ---------------- Demo reset ----------------

// Clears admin settings, handover progress, notifications and the audit log (demo only),
// then records the reset as the first entry of the new log.
export async function mockAdminResetDemo(user) {
  requireAdmin(user, A.DEMO_DATA_RESET)
  storage.clear()
  mockResetHandovers(user)
  resetNotifications()
  resetAudit()
  emitSystemEvent({ user, action: A.DEMO_DATA_RESET, entity: { type: 'DEMO', id: 'all' }, details: { scope: 'all' } })
}
