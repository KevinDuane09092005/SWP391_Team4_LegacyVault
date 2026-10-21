import { actorOf, appendAudit } from './mockAuditStore.js'
import { pushNotification } from './mockNotificationStore.js'

// DEMO ONLY — "System Event → Audit Log + Notification Service → Relevant Actor" (Flow 7).
// Flows 1–6 call emitSystemEvent() at the moment something important happens.
// The caller decides who is notified, because only it knows who is allowed to know:
// recipients are always explicit user ids, never "everyone".
//
// event = {
//   user,            the signed-in actor (or null)
//   identifier,      shown as actor when there is no user (failed sign-in)
//   action, outcome, severity, entity, caseId, details   → audit entry (details are sanitized)
//   notify: [{ userId, type, params }]                    → one in-app notification each
// }
export function emitSystemEvent({ user = null, identifier, notify = [], ...audit }) {
  const entry = appendAudit({ actor: actorOf(user, identifier), ...audit })
  for (const target of notify) {
    if (!target?.userId) continue
    pushNotification({ caseId: audit.caseId ?? null, ...target })
  }
  return entry
}
