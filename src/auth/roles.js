// The five LegacyVault roles. Always use these constants instead of typing the strings.
export const ROLES = {
  ADMIN: 'ADMIN',
  VAULT_OWNER: 'VAULT_OWNER',
  EXECUTOR: 'EXECUTOR', // also called Trustee / Digital Executor
  BENEFICIARY: 'BENEFICIARY',
  LEGAL_VERIFIER: 'LEGAL_VERIFIER', // also called Notary
}

// Maps Backend / DB role codes (e.g. USER, SYSTEM_ADMIN, DIGITAL_EXECUTOR) to Frontend ROLES constants.
export function normalizeRole(role) {
  const cleaned = String(role || 'VAULT_OWNER')
    .trim()
    .toUpperCase()
    .replace(/[ -]+/g, '_')

  if (cleaned === 'USER' || cleaned === 'VAULT_OWNER' || cleaned === 'OWNER') {
    return ROLES.VAULT_OWNER
  }
  if (cleaned === 'SYSTEM_ADMIN' || cleaned === 'ADMIN') {
    return ROLES.ADMIN
  }
  if (cleaned === 'DIGITAL_EXECUTOR' || cleaned === 'EXECUTOR' || cleaned === 'TRUSTEE') {
    return ROLES.EXECUTOR
  }
  if (cleaned === 'BENEFICIARY') {
    return ROLES.BENEFICIARY
  }
  if (cleaned === 'LEGAL_VERIFIER' || cleaned === 'VERIFIER' || cleaned === 'NOTARY') {
    return ROLES.LEGAL_VERIFIER
  }
  return cleaned
}

// Where each role lands after signing in.
export const DASHBOARD_PATHS = {
  [ROLES.ADMIN]: '/dashboard/admin',
  [ROLES.VAULT_OWNER]: '/dashboard/owner',
  [ROLES.EXECUTOR]: '/dashboard/executor',
  [ROLES.BENEFICIARY]: '/dashboard/beneficiary',
  [ROLES.LEGAL_VERIFIER]: '/dashboard/verifier',
}

export function isKnownRole(role) {
  return Object.values(ROLES).includes(normalizeRole(role))
}

export function getDashboardPath(role) {
  return DASHBOARD_PATHS[normalizeRole(role)] ?? '/login'
}
