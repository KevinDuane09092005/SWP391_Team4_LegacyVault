import { AdminError } from '../admin/AdminError.js'
import { AUDIT_ACTIONS, OUTCOME, SEVERITY, isSecurityAlert, sanitizeDetails } from '../audit/auditRules.js'
import { ROLES } from '../auth/roles.js'
import { createDemoStorage } from './demoStorage.js'
import { seedAuditLog } from './mockFlow7Seeds.js'

// DEMO ONLY — audit log (Flow 7).
// Entries are written by the mock services and kept in this browser's localStorage.
// That is NOT a secure, tamper-proof, server-side audit trail: anyone with the browser
// can read, edit or clear it. A real backend must write the audit log itself.
// Details pass through sanitizeDetails(), so passwords, OTP codes, ID numbers, keys and
// asset contents are never stored.

const storage = createDemoStorage('legacyvault-demo-audit-log')
const MAX_ENTRIES = 500
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const copy = (value) => structuredClone(value)

function load() {
  const saved = storage.get()
  return saved?.entries ?? copy(seedAuditLog)
}

// Who did it, without anything secret. `user` may be null (e.g. a failed sign-in).
export function actorOf(user, fallbackIdentifier) {
  if (user) return { id: user.id, name: user.fullName ?? user.name, role: user.role }
  return { id: null, name: fallbackIdentifier ? String(fallbackIdentifier).slice(0, 80) : 'anonymous', role: null }
}

export function appendAudit({ actor, action, outcome = OUTCOME.SUCCESS, severity, entity = null, caseId = null, details }) {
  const entries = load()
  const item = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    actor,
    action,
    outcome,
    severity: severity ?? (outcome === OUTCOME.SUCCESS ? SEVERITY.INFO : SEVERITY.WARNING),
    entity,
    caseId,
    details: sanitizeDetails(details),
  }
  storage.set({ entries: [item, ...entries].slice(0, MAX_ENTRIES) })
  return item
}

function requireAdmin(user) {
  if (!user) throw new AdminError('NOT_SIGNED_IN')
  if (user.role !== ROLES.ADMIN) {
    appendAudit({ actor: actorOf(user), action: AUDIT_ACTIONS.ADMIN_ACCESS, outcome: OUTCOME.DENIED,
      entity: { type: 'AUDIT_LOG', id: 'all' } })
    throw new AdminError('ADMIN_ONLY')
  }
}

// filters: { action, outcome, actor (text), from, to (yyyy-mm-dd), alertsOnly }
export async function mockListAudit(user, filters = {}) {
  await delay(200)
  requireAdmin(user)
  const actorText = (filters.actor ?? '').trim().toLowerCase()
  return copy(load().filter((entry) => {
    if (filters.alertsOnly && !isSecurityAlert(entry)) return false
    if (filters.action && entry.action !== filters.action) return false
    if (filters.outcome && entry.outcome !== filters.outcome) return false
    if (actorText && ![entry.actor?.name, entry.actor?.id, entry.caseId, entry.entity?.id]
      .some((value) => String(value ?? '').toLowerCase().includes(actorText))) return false
    const day = entry.at.slice(0, 10)
    if (filters.from && day < filters.from) return false
    if (filters.to && day > filters.to) return false
    return true
  }))
}

export function resetAudit() {
  storage.clear()
}
