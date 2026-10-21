// Flow 7 — audit log vocabulary and the rule that keeps secrets out of the log.

export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LEGAL_STATUS_CHANGED: 'LEGAL_STATUS_CHANGED',
  HANDOVER_START: 'HANDOVER_START',
  CASE_ACCESS: 'CASE_ACCESS',
  IDENTITY_VERIFICATION: 'IDENTITY_VERIFICATION',
  AUTHORIZATION_CHECK: 'AUTHORIZATION_CHECK',
  ASSET_ACCESS: 'ASSET_ACCESS',
  ASSET_DOWNLOAD: 'ASSET_DOWNLOAD',
  RECEIPT_CONFIRMATION: 'RECEIPT_CONFIRMATION',
  HANDOVER_COMPLETED: 'HANDOVER_COMPLETED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
  POLICY_CHANGED: 'POLICY_CHANGED',
  INTEGRATION_CHANGED: 'INTEGRATION_CHANGED',
  ADMIN_ACCESS: 'ADMIN_ACCESS',
  DEMO_DATA_RESET: 'DEMO_DATA_RESET',
}

export const OUTCOME = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE', // the user tried and got it wrong (e.g. wrong OTP)
  DENIED: 'DENIED', // the system refused because a rule said no
}

export const SEVERITY = { INFO: 'INFO', WARNING: 'WARNING', CRITICAL: 'CRITICAL' }

// Keys that must never reach the log, whatever the caller passes.
const FORBIDDEN_KEY = /pass|otp|pin|secret|private|seed|mnemonic|token|content|idnumber|cardnumber|credential|key$/i

// Only plain, short values survive; anything that looks like a secret is dropped.
export function sanitizeDetails(details = {}) {
  const safe = {}
  for (const [name, value] of Object.entries(details ?? {})) {
    if (FORBIDDEN_KEY.test(name)) continue
    if (Array.isArray(value)) {
      safe[name] = value.filter((item) => typeof item === 'string' || typeof item === 'number').slice(0, 20)
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      safe[name] = value
    } else if (typeof value === 'string') {
      safe[name] = value.slice(0, 120)
    }
  }
  return safe
}

// Security alerts = every refused or failed action, plus anything marked as a warning.
export function isSecurityAlert(entry) {
  return entry.outcome !== OUTCOME.SUCCESS || entry.severity !== SEVERITY.INFO
}
