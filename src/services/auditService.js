import { AUDIT_ACTIONS, OUTCOME } from '../audit/auditRules.js'
import { mockListAudit } from '../mocks/mockAuditStore.js'
import { emitSystemEvent } from '../mocks/mockSystemEvents.js'

// Flow 7 — Audit Log. No audit backend exists yet: entries are written by the demo mocks
// into this browser (see src/mocks/mockAuditStore.js). They are NOT a secure,
// tamper-proof server-side audit trail.

export const IS_DEMO_MODE = true

// Admin only (checked inside the mock as well).
export const listAuditLog = (user, filters) => mockListAudit(user, filters)

// Sign-in / sign-out events from Flow 1. Never pass the password here.
export function recordSignIn({ user, identifier, success, reason }) {
  emitSystemEvent({
    user: success ? user : null,
    identifier,
    action: AUDIT_ACTIONS.LOGIN,
    outcome: success ? OUTCOME.SUCCESS : OUTCOME.FAILURE,
    entity: { type: 'SESSION', id: success ? user.id : 'unknown' },
    details: success ? {} : { reason },
  })
}

export function recordSignOut(user) {
  emitSystemEvent({ user, action: AUDIT_ACTIONS.LOGOUT, entity: { type: 'SESSION', id: user.id } })
}
