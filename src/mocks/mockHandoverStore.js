import { AUDIT_ACTIONS as A, OUTCOME, SEVERITY } from '../audit/auditRules.js'
import { ROLES } from '../auth/roles.js'
import { HandoverError } from '../handover/HandoverError.js'
import { DENY, authorizedAssets, checkAssetAccess, checkCaseAccess } from '../handover/handoverAccess.js'
import { HANDOVER_STATUS, LEGAL_STATUS, canStartHandover, hasReached } from '../handover/handoverStatus.js'
import { createDemoStorage } from './demoStorage.js'
import { clearCaseNotifications } from './mockNotificationStore.js'
import { emitSystemEvent } from './mockSystemEvents.js'
import { DEMO_OTP_CODE, mockUsers } from './mockUsers.js'
import { seedHandovers } from './mockHandovers.js'

// DEMO ONLY — pretends to be the backend for Flow 6 (Asset Handover).
// - Nothing is sent anywhere: no e-mail/SMS notification, no OTP provider, no KYC provider,
//   no real decryption. "Decrypting" an asset just returns the sample text from mockHandovers.js.
// - Progress (statuses, timestamps) is saved in this browser's localStorage so the Executor
//   and Beneficiary demo accounts see the same case after signing out and in again.
//   Asset content and OTP / ID numbers are never saved.
// - Every call re-runs the checks in src/handover/handoverAccess.js, like a backend would.
// - Important steps (and refusals) are reported to Flow 7 through emitSystemEvent():
//   an audit entry plus in-app notifications for the people concerned.

const storage = createDemoStorage('legacyvault-demo-handover-progress')
const MAX_OTP_ATTEMPTS = 5

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const copy = (value) => structuredClone(value)
const now = () => new Date().toISOString()

// Fields of a case that change during the flow (the rest comes from the seed data).
const PROGRESS_FIELDS = ['status', 'legalStatus', 'beneficiaryUserId', 'verification', 'authorizationCheckedAt',
  'accessedAssetIds', 'completedAt', 'timeline']

// Starting progress; a seed case may begin mid-flow through its `seedProgress` (demo test data).
function freshProgress(handover) {
  return {
    status: handover.status,
    legalStatus: handover.legalStatus,
    beneficiaryUserId: null,
    verification: { failedAttempts: 0, verifiedAt: null },
    authorizationCheckedAt: null,
    accessedAssetIds: [],
    completedAt: null,
    timeline: [],
    ...copy(handover.seedProgress ?? {}),
  }
}

function loadState() {
  const saved = storage.get()
  const progress = {}
  for (const handover of seedHandovers) {
    progress[handover.id] = { ...freshProgress(handover), ...(saved?.progress?.[handover.id] ?? {}) }
  }
  return { progress }
}

function saveState(state) {
  const progress = {}
  for (const [id, item] of Object.entries(state.progress)) {
    progress[id] = Object.fromEntries(PROGRESS_FIELDS.map((field) => [field, item[field]]))
  }
  storage.set({ progress })
}

// The full case = seed data + saved progress. Internal only (contains protected content).
function readCase(state, id) {
  const seed = seedHandovers.find((item) => item.id === id)
  if (!seed) return null
  const progress = state.progress[id]
  return {
    ...copy(seed),
    ...copy(progress),
    beneficiary: { ...seed.beneficiary, userId: progress.beneficiaryUserId },
  }
}

function addEvent(progress, type) {
  progress.timeline = [...progress.timeline, { type, at: now() }]
}

// Asset without its protected content.
function withoutContent(asset) {
  const rest = { ...asset }
  delete rest.protectedContent
  return rest
}

// What the Executor may see: no protected content, only whether each asset goes to this beneficiary.
function toExecutorView(handover) {
  const beneficiaryId = handover.beneficiary.userId ?? findUserByEmail(handover.beneficiary.email)?.id
  return {
    ...handover,
    assets: handover.assets.map(({ authorizedBeneficiaryIds, ...asset }) => ({
      ...withoutContent(asset),
      forThisBeneficiary: Boolean(beneficiaryId) && authorizedBeneficiaryIds.includes(beneficiaryId),
    })),
  }
}

// What the Beneficiary may see: only their own assets, still without protected content.
function toBeneficiaryView(user, handover) {
  return {
    id: handover.id,
    vault: { name: handover.vault.name, ownerName: handover.vault.owner.name },
    legalCaseId: handover.legalCaseId,
    legalStatus: handover.legalStatus,
    status: handover.status,
    beneficiary: handover.beneficiary,
    verification: { verifiedAt: handover.verification.verifiedAt, failedAttempts: handover.verification.failedAttempts,
      locked: handover.verification.failedAttempts >= MAX_OTP_ATTEMPTS },
    authorizationCheckedAt: handover.authorizationCheckedAt,
    accessedAssetIds: handover.accessedAssetIds,
    completedAt: handover.completedAt,
    timeline: handover.timeline,
    // Other beneficiaries' ids are not revealed: the list only says "granted to you".
    assets: authorizedAssets(user, handover).map((asset) => ({
      ...withoutContent(asset),
      authorizedBeneficiaryIds: [user.id],
    })),
  }
}

function findUserByEmail(email) {
  return mockUsers.find((user) => user.identifier.toLowerCase() === email.toLowerCase() && user.role === ROLES.BENEFICIARY)
}

const caseEntity = (caseId) => ({ type: 'HANDOVER', id: caseId })

// Records the refusal in the audit log (plus any notification), then throws it.
function deny(user, action, caseId, code, details = {}, notify = []) {
  emitSystemEvent({ user, action, outcome: OUTCOME.DENIED, entity: caseEntity(caseId), caseId,
    details: { reason: code, ...details }, notify })
  throw new HandoverError(code, details)
}

function requireRole(user, role, action, caseId = null) {
  if (!user) throw new HandoverError('NOT_SIGNED_IN')
  if (user.role !== role) deny(user, action, caseId, 'WRONG_ROLE')
}

// Loads a case for the Beneficiary and throws when the central check says no.
function requireBeneficiaryCase(state, user, caseId, action = A.CASE_ACCESS) {
  requireRole(user, ROLES.BENEFICIARY, action, caseId)
  const handover = readCase(state, caseId)
  const check = checkCaseAccess(user, handover)
  // Unassigned or unknown cases give the same error, so case ids cannot be probed.
  if (!check.allowed) deny(user, action, caseId, 'CASE_NOT_FOUND', { reasons: check.reasons })
  return handover
}

// ---------------- Legal Verification (Flow 5 hook) ----------------

// Flow 5 is not in this app yet. When it is, its approve / reject action should call this,
// so the Executor is notified and the decision is audited. Only tests call it today.
export async function mockRecordLegalDecision(user, caseId, legalStatus) {
  await delay(100)
  requireRole(user, ROLES.LEGAL_VERIFIER, A.LEGAL_STATUS_CHANGED, caseId)
  const state = loadState()
  const handover = readCase(state, caseId)
  if (!handover) throw new HandoverError('CASE_NOT_FOUND')
  if (handover.legalStatus === LEGAL_STATUS.APPROVED || handover.legalStatus === LEGAL_STATUS.REJECTED) {
    throw new HandoverError('INVALID_STATE')
  }
  const approved = legalStatus === LEGAL_STATUS.APPROVED
  const progress = state.progress[caseId]
  progress.legalStatus = approved ? LEGAL_STATUS.APPROVED : LEGAL_STATUS.REJECTED
  progress.status = approved ? HANDOVER_STATUS.APPROVED : HANDOVER_STATUS.REJECTED
  saveState(state)
  emitSystemEvent({
    user, action: A.LEGAL_STATUS_CHANGED, entity: { type: 'LEGAL_CASE', id: handover.legalCaseId }, caseId,
    details: { legalStatus: progress.legalStatus },
    notify: [{
      userId: handover.executorId,
      type: approved ? 'LEGAL_APPROVED' : 'LEGAL_REJECTED',
      params: { caseId, legalCaseId: handover.legalCaseId },
    }],
  })
  return toExecutorView(readCase(state, caseId))
}

// ---------------- Executor ----------------

export async function mockListExecutorCases(user) {
  await delay(250)
  requireRole(user, ROLES.EXECUTOR, A.CASE_ACCESS)
  const state = loadState()
  return seedHandovers
    .filter((seed) => seed.executorId === user.id)
    .map((seed) => toExecutorView(readCase(state, seed.id)))
}

// Steps 2–4: start the handover, identify the beneficiary, notify them (in-app only).
export async function mockStartHandover(user, caseId) {
  await delay(500)
  requireRole(user, ROLES.EXECUTOR, A.HANDOVER_START, caseId)
  const state = loadState()
  const handover = readCase(state, caseId)
  if (!handover || handover.executorId !== user.id) deny(user, A.HANDOVER_START, caseId, 'CASE_NOT_FOUND')
  if (hasReached(handover.status, HANDOVER_STATUS.HANDOVER_INITIATED)) {
    deny(user, A.HANDOVER_START, caseId, 'ALREADY_STARTED')
  }
  if (!canStartHandover(handover)) {
    deny(user, A.HANDOVER_START, caseId, 'LEGAL_NOT_APPROVED', { legalStatus: handover.legalStatus })
  }

  const beneficiaryUser = findUserByEmail(handover.beneficiary.email)
  if (!beneficiaryUser) deny(user, A.HANDOVER_START, caseId, 'BENEFICIARY_NOT_FOUND')
  if (!handover.assets.some((asset) => asset.authorizedBeneficiaryIds.includes(beneficiaryUser.id))) {
    deny(user, A.HANDOVER_START, caseId, 'NO_AUTHORIZED_ASSETS', { beneficiaryId: beneficiaryUser.id })
  }

  const progress = state.progress[caseId]
  progress.status = HANDOVER_STATUS.HANDOVER_INITIATED
  addEvent(progress, 'HANDOVER_INITIATED')
  progress.beneficiaryUserId = beneficiaryUser.id
  addEvent(progress, 'BENEFICIARY_IDENTIFIED')
  progress.status = HANDOVER_STATUS.BENEFICIARY_VERIFICATION_PENDING
  addEvent(progress, 'BENEFICIARY_NOTIFIED')
  saveState(state)

  // Only the identified beneficiary of this case is notified.
  emitSystemEvent({
    user, action: A.HANDOVER_START, entity: caseEntity(caseId), caseId,
    details: { beneficiaryId: beneficiaryUser.id },
    notify: [{ userId: beneficiaryUser.id, type: 'HANDOVER_STARTED', params: { caseId, ownerName: handover.vault.owner.name } }],
  })
  return toExecutorView(readCase(state, caseId))
}

// ---------------- Beneficiary ----------------

export async function mockListBeneficiaryCases(user) {
  await delay(250)
  requireRole(user, ROLES.BENEFICIARY, A.CASE_ACCESS)
  const state = loadState()
  return seedHandovers
    .map((seed) => readCase(state, seed.id))
    .filter((handover) => checkCaseAccess(user, handover).allowed)
    .map((handover) => toBeneficiaryView(user, handover))
}

export async function mockGetBeneficiaryCase(user, caseId) {
  await delay(250)
  const state = loadState()
  return toBeneficiaryView(user, requireBeneficiaryCase(state, user, caseId))
}

// Steps 6–7: demo OTP + KYC. The OTP is DEMO_OTP_CODE; nothing is sent or checked by a provider.
// The audit entry records only the outcome and the attempts left — never the code, name or ID number.
export async function mockVerifyIdentity(user, caseId, { otp, fullName, idNumber }) {
  await delay(700)
  const state = loadState()
  const handover = requireBeneficiaryCase(state, user, caseId, A.IDENTITY_VERIFICATION)
  const progress = state.progress[caseId]
  if (handover.verification.verifiedAt) throw new HandoverError('ALREADY_VERIFIED')
  if (handover.status !== HANDOVER_STATUS.BENEFICIARY_VERIFICATION_PENDING) throw new HandoverError('INVALID_STATE')
  if (handover.verification.failedAttempts >= MAX_OTP_ATTEMPTS) {
    deny(user, A.IDENTITY_VERIFICATION, caseId, 'VERIFICATION_LOCKED')
  }

  const nameMatches = fullName.trim().toLowerCase() === handover.beneficiary.name.toLowerCase()
  if (otp !== DEMO_OTP_CODE || !nameMatches || !/^(\d{9}|\d{12})$/.test(idNumber)) {
    progress.verification = { ...progress.verification, failedAttempts: progress.verification.failedAttempts + 1 }
    addEvent(progress, 'VERIFICATION_FAILED')
    saveState(state)
    const attemptsLeft = MAX_OTP_ATTEMPTS - progress.verification.failedAttempts
    const locked = attemptsLeft <= 0
    emitSystemEvent({
      user, action: A.IDENTITY_VERIFICATION, outcome: OUTCOME.FAILURE, caseId, entity: caseEntity(caseId),
      severity: locked ? SEVERITY.CRITICAL : SEVERITY.WARNING,
      details: { attemptsLeft, locked },
      // A lock needs a person to step in: tell the beneficiary and the case executor.
      notify: locked
        ? [
          { userId: user.id, type: 'VERIFICATION_LOCKED', params: { caseId } },
          { userId: handover.executorId, type: 'VERIFICATION_LOCKED_EXECUTOR', params: { caseId } },
        ]
        : [],
    })
    throw new HandoverError(locked ? 'VERIFICATION_LOCKED' : 'VERIFICATION_FAILED', { attemptsLeft })
  }

  progress.verification = { ...progress.verification, verifiedAt: now() }
  progress.status = HANDOVER_STATUS.IDENTITY_VERIFIED
  addEvent(progress, 'IDENTITY_VERIFIED')
  saveState(state)
  emitSystemEvent({
    user, action: A.IDENTITY_VERIFICATION, caseId, entity: caseEntity(caseId), details: { demoCheck: true },
    notify: [{ userId: user.id, type: 'IDENTITY_VERIFIED', params: { caseId } }],
  })
  return toBeneficiaryView(user, readCase(state, caseId))
}

// Step 8: check authorization and asset permissions.
export async function mockRunAuthorizationCheck(user, caseId) {
  await delay(500)
  const state = loadState()
  const handover = requireBeneficiaryCase(state, user, caseId, A.AUTHORIZATION_CHECK)
  if (handover.status !== HANDOVER_STATUS.IDENTITY_VERIFIED) throw new HandoverError('INVALID_STATE')

  const progress = state.progress[caseId]
  const granted = authorizedAssets(user, handover)
  // Same rules as opening an asset (handoverAccess.js), except the step being done right now.
  const reasons = granted.length
    ? checkAssetAccess(user, handover, granted[0].id).reasons.filter((code) => code !== DENY.AUTHORIZATION_NOT_CHECKED)
    : ['NO_AUTHORIZED_ASSETS']
  if (reasons.length) {
    addEvent(progress, 'AUTHORIZATION_FAILED')
    saveState(state)
    deny(user, A.AUTHORIZATION_CHECK, caseId, 'AUTHORIZATION_FAILED', { reasons },
      [{ userId: user.id, type: 'AUTHORIZATION_DENIED', params: { caseId } }])
  }

  progress.authorizationCheckedAt = now()
  progress.status = HANDOVER_STATUS.AUTHORIZATION_CHECKED
  addEvent(progress, 'AUTHORIZATION_CHECKED')
  progress.status = HANDOVER_STATUS.READY_FOR_ACCESS
  addEvent(progress, 'READY_FOR_ACCESS')
  saveState(state)
  emitSystemEvent({
    user, action: A.AUTHORIZATION_CHECK, caseId, entity: caseEntity(caseId), details: { authorizedAssets: granted.length },
    notify: [{ userId: user.id, type: 'AUTHORIZATION_GRANTED', params: { caseId, count: granted.length } }],
  })
  return toBeneficiaryView(user, readCase(state, caseId))
}

// Steps 9–10: "decrypt" (demo: return sample text) one authorized asset.
// The audit entry names the asset only; the content is never logged.
export async function mockOpenAsset(user, caseId, assetId) {
  await delay(600)
  const state = loadState()
  const handover = requireBeneficiaryCase(state, user, caseId, A.ASSET_ACCESS)
  const check = checkAssetAccess(user, handover, assetId)
  if (!check.allowed) deny(user, A.ASSET_ACCESS, caseId, 'ACCESS_DENIED', { reasons: check.reasons, assetId })

  const progress = state.progress[caseId]
  if (!progress.accessedAssetIds.includes(assetId)) {
    progress.accessedAssetIds = [...progress.accessedAssetIds, assetId]
    addEvent(progress, 'ASSET_ACCESSED')
  }
  if (progress.status === HANDOVER_STATUS.READY_FOR_ACCESS) {
    progress.status = HANDOVER_STATUS.RECEIPT_PENDING
    addEvent(progress, 'RECEIPT_PENDING')
  }
  saveState(state)
  emitSystemEvent({ user, action: A.ASSET_ACCESS, caseId, entity: { type: 'ASSET', id: assetId } })
  const asset = handover.assets.find((item) => item.id === assetId)
  return { assetId, content: asset.protectedContent, case: toBeneficiaryView(user, readCase(state, caseId)) }
}

// Step 10 (download): the file is built in the browser, but the right to download is
// checked and audited here first.
export async function mockRecordAssetDownload(user, caseId, assetId) {
  await delay(150)
  const state = loadState()
  const handover = requireBeneficiaryCase(state, user, caseId, A.ASSET_DOWNLOAD)
  const check = checkAssetAccess(user, handover, assetId)
  if (!check.allowed) deny(user, A.ASSET_DOWNLOAD, caseId, 'ACCESS_DENIED', { reasons: check.reasons, assetId })
  emitSystemEvent({ user, action: A.ASSET_DOWNLOAD, caseId, entity: { type: 'ASSET', id: assetId } })
}

// Steps 11–12: confirm receipt. A second call fails, so completion cannot happen twice.
// COMPLETED is written only after every check above has passed.
export async function mockConfirmReceipt(user, caseId) {
  await delay(600)
  const state = loadState()
  const handover = requireBeneficiaryCase(state, user, caseId, A.RECEIPT_CONFIRMATION)
  if (handover.status === HANDOVER_STATUS.COMPLETED) {
    deny(user, A.RECEIPT_CONFIRMATION, caseId, 'ALREADY_COMPLETED')
  }
  if (handover.status !== HANDOVER_STATUS.RECEIPT_PENDING) throw new HandoverError('INVALID_STATE')

  const progress = state.progress[caseId]
  progress.status = HANDOVER_STATUS.COMPLETED
  progress.completedAt = now()
  addEvent(progress, 'COMPLETED')
  saveState(state)

  emitSystemEvent({ user, action: A.RECEIPT_CONFIRMATION, caseId, entity: caseEntity(caseId) })
  const params = { caseId, beneficiaryName: handover.beneficiary.name }
  emitSystemEvent({
    user, action: A.HANDOVER_COMPLETED, caseId, entity: caseEntity(caseId),
    notify: [
      { userId: handover.executorId, type: 'HANDOVER_COMPLETED', params },
      { userId: user.id, type: 'HANDOVER_COMPLETED', params },
    ],
  })
  return toBeneficiaryView(user, readCase(state, caseId))
}

// Demo reset of handover progress and handover notifications. The audit log is kept
// (only an Admin can reset it) and the reset itself is recorded.
export function mockResetHandovers(user = null) {
  storage.clear()
  clearCaseNotifications()
  emitSystemEvent({ user, action: A.DEMO_DATA_RESET, entity: { type: 'HANDOVER', id: 'all' }, details: { scope: 'handovers' } })
}
