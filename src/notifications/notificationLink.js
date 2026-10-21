import { ROLES } from '../auth/roles.js'

// Flow 7 — Where a notification may send its reader. Only to pages of the reader's own role;
// the page itself still checks access (a link is never the permission).
export function notificationLink(user, item) {
  if (!item.caseId) return null
  if (user.role === ROLES.BENEFICIARY) return `/dashboard/beneficiary/handover/${item.caseId}`
  if (user.role === ROLES.EXECUTOR) return '/dashboard/executor'
  return null
}
