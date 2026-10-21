import { ROLES } from '../auth/roles.js'
import { HANDOVER_STATUS, LEGAL_STATUS, hasReached } from './handoverStatus.js'

// Flow 6 — the ONE place that decides whether a Beneficiary may see a handover case
// or one of its assets. Screens and the mock service both call these functions,
// so the rules are never copied into UI components.
//
// This is a frontend safeguard for the demo only. A real backend must run the same
// checks on every request; hiding something in the browser is not security.

// Reason codes (texts live in src/data/handoverContent.js → denyReasons).
export const DENY = {
  NOT_SIGNED_IN: 'NOT_SIGNED_IN',
  WRONG_ROLE: 'WRONG_ROLE',
  CASE_NOT_FOUND: 'CASE_NOT_FOUND',
  NOT_ASSIGNED: 'NOT_ASSIGNED',
  HANDOVER_NOT_STARTED: 'HANDOVER_NOT_STARTED',
  LEGAL_NOT_APPROVED: 'LEGAL_NOT_APPROVED',
  HANDOVER_REJECTED: 'HANDOVER_REJECTED',
  HANDOVER_COMPLETED: 'HANDOVER_COMPLETED',
  IDENTITY_NOT_VERIFIED: 'IDENTITY_NOT_VERIFIED',
  AUTHORIZATION_NOT_CHECKED: 'AUTHORIZATION_NOT_CHECKED',
  ASSET_NOT_FOUND: 'ASSET_NOT_FOUND',
  ASSET_NOT_AUTHORIZED: 'ASSET_NOT_AUTHORIZED',
}

const result = (reasons) => ({ allowed: reasons.length === 0, reasons })

// May this user open the case at all (see its status and verify their identity)?
export function checkCaseAccess(user, handover) {
  if (!user) return result([DENY.NOT_SIGNED_IN])
  if (user.role !== ROLES.BENEFICIARY) return result([DENY.WRONG_ROLE])
  if (!handover) return result([DENY.CASE_NOT_FOUND])
  if (handover.beneficiary?.userId !== user.id) return result([DENY.NOT_ASSIGNED])
  // Before the Executor starts the handover, the Beneficiary is not told about the case.
  if (!hasReached(handover.status, HANDOVER_STATUS.HANDOVER_INITIATED)) {
    return result([DENY.HANDOVER_NOT_STARTED])
  }
  return result([])
}

// May this user see the protected content of one asset in the case?
// Every condition is checked and every failing one is reported.
export function checkAssetAccess(user, handover, assetId) {
  const caseCheck = checkCaseAccess(user, handover)
  if (!caseCheck.allowed) return caseCheck

  const reasons = []
  if (handover.legalStatus !== LEGAL_STATUS.APPROVED) reasons.push(DENY.LEGAL_NOT_APPROVED)
  if (handover.status === HANDOVER_STATUS.REJECTED) reasons.push(DENY.HANDOVER_REJECTED)
  if (handover.status === HANDOVER_STATUS.COMPLETED) reasons.push(DENY.HANDOVER_COMPLETED)
  if (!handover.verification?.verifiedAt) reasons.push(DENY.IDENTITY_NOT_VERIFIED)
  if (!handover.authorizationCheckedAt) reasons.push(DENY.AUTHORIZATION_NOT_CHECKED)

  const asset = handover.assets?.find((item) => item.id === assetId)
  if (!asset) reasons.push(DENY.ASSET_NOT_FOUND)
  else if (!asset.authorizedBeneficiaryIds?.includes(user.id)) reasons.push(DENY.ASSET_NOT_AUTHORIZED)

  return result(reasons)
}

// Assets of the case explicitly granted to this user. Never returns other people's assets.
export function authorizedAssets(user, handover) {
  if (!user || !handover) return []
  return (handover.assets ?? []).filter((asset) => asset.authorizedBeneficiaryIds?.includes(user.id))
}
