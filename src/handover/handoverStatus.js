// Flow 6 — the statuses a handover case moves through, in order.
// Keys match the backend contract names, so they can be sent/received unchanged.
export const HANDOVER_STATUS = {
  PENDING_LEGAL_APPROVAL: 'PENDING_LEGAL_APPROVAL',
  APPROVED: 'APPROVED',
  HANDOVER_INITIATED: 'HANDOVER_INITIATED',
  BENEFICIARY_VERIFICATION_PENDING: 'BENEFICIARY_VERIFICATION_PENDING',
  IDENTITY_VERIFIED: 'IDENTITY_VERIFIED',
  AUTHORIZATION_CHECKED: 'AUTHORIZATION_CHECKED',
  READY_FOR_ACCESS: 'READY_FOR_ACCESS',
  RECEIPT_PENDING: 'RECEIPT_PENDING',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
}

// Result of Flow 5 (Legal Verification) as seen by this flow.
export const LEGAL_STATUS = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

// The happy path, used to draw the progress steps.
export const HANDOVER_STEPS = [
  HANDOVER_STATUS.APPROVED,
  HANDOVER_STATUS.HANDOVER_INITIATED,
  HANDOVER_STATUS.BENEFICIARY_VERIFICATION_PENDING,
  HANDOVER_STATUS.IDENTITY_VERIFIED,
  HANDOVER_STATUS.AUTHORIZATION_CHECKED,
  HANDOVER_STATUS.READY_FOR_ACCESS,
  HANDOVER_STATUS.RECEIPT_PENDING,
  HANDOVER_STATUS.COMPLETED,
]

// Position of a status on the happy path (-1 for PENDING_LEGAL_APPROVAL / REJECTED).
export function stepIndex(status) {
  return HANDOVER_STEPS.indexOf(status)
}

// True once the case has reached (or passed) `status` on the happy path.
export function hasReached(current, status) {
  const index = stepIndex(current)
  return index >= 0 && index >= stepIndex(status)
}

// The Executor may start only an approved case that has not been started yet.
export function canStartHandover(handover) {
  return (
    handover?.legalStatus === LEGAL_STATUS.APPROVED &&
    handover.status === HANDOVER_STATUS.APPROVED
  )
}

// Badge colour for each status (see .handover-status--* in handover.css).
export function statusTone(status) {
  if (status === HANDOVER_STATUS.COMPLETED) return 'success'
  if (status === HANDOVER_STATUS.REJECTED) return 'danger'
  if (status === HANDOVER_STATUS.PENDING_LEGAL_APPROVAL) return 'warning'
  if (status === HANDOVER_STATUS.APPROVED) return 'neutral'
  return 'info'
}
