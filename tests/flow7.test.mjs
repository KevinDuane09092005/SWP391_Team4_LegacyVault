// Flow 7 (notifications, audit, administration) and its integration with Flow 6.
// Run with: node --test tests/flow7.test.mjs
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { mockUsers, DEMO_OTP_CODE, DEMO_PASSWORD } from '../src/mocks/mockUsers.js'
import * as handover from '../src/mocks/mockHandoverStore.js'
import * as notifications from '../src/mocks/mockNotificationStore.js'
import * as audit from '../src/mocks/mockAuditStore.js'
import * as admin from '../src/mocks/mockAdminStore.js'
import { recordSignIn } from '../src/services/auditService.js'
import { sanitizeDetails } from '../src/audit/auditRules.js'

const user = (id) => mockUsers.find((item) => item.id === id)
const adminUser = user('demo-admin')
const executor = user('demo-executor')
const ben = user('demo-beneficiary')
const ben2 = user('demo-beneficiary-2')
const verifier = user('demo-verifier')
const owner = user('demo-owner')
const ID_NUMBER = '012345678901'
const verifyForm = { otp: DEMO_OTP_CODE, fullName: 'Demo Beneficiary', idNumber: ID_NUMBER }

const rejectsWith = (promise, code) => assert.rejects(promise, (error) => error.code === code)
const latest = async (filters = {}) => audit.mockListAudit(adminUser, filters)
const findAudit = async (action, caseId, outcome) =>
  (await latest()).filter((e) => e.action === action && (!caseId || e.caseId === caseId) && (!outcome || e.outcome === outcome))
const mine = async (u, caseId) => (await notifications.mockListMyNotifications(u)).filter((n) => !caseId || n.caseId === caseId)

async function runToReceiptPending(caseId = 'HO-2041') {
  await handover.mockStartHandover(executor, caseId)
  await handover.mockVerifyIdentity(ben, caseId, verifyForm)
  await handover.mockRunAuthorizationCheck(ben, caseId)
  await handover.mockOpenAsset(ben, caseId, 'ho-asset-will')
}

beforeEach(() => {
  handover.mockResetHandovers()
  notifications.resetNotifications()
  audit.resetAudit()
})

test('1/2. starting a handover notifies only the assigned beneficiary', async () => {
  await handover.mockStartHandover(executor, 'HO-2041')
  const forBen = await mine(ben, 'HO-2041')
  assert.equal(forBen.length, 1)
  assert.equal(forBen[0].type, 'HANDOVER_STARTED')
  assert.equal(forBen[0].read, false)
  assert.deepEqual(await mine(ben2, 'HO-2041'), [])
  assert.deepEqual(await mine(owner, 'HO-2041'), [])
  // A user cannot mark someone else's notification as read, and cannot open the case.
  await rejectsWith(notifications.mockMarkNotificationRead(ben2, forBen[0].id), 'NOT_FOUND')
  await rejectsWith(handover.mockGetBeneficiaryCase(ben2, 'HO-2041'), 'CASE_NOT_FOUND')
  // The refused attempt is audited.
  assert.equal((await findAudit('CASE_ACCESS', 'HO-2041', 'DENIED')).length, 1)
})

test('read / unread state', async () => {
  await handover.mockStartHandover(executor, 'HO-2041')
  const [item] = await mine(ben, 'HO-2041')
  await notifications.mockMarkNotificationRead(ben, item.id)
  assert.equal((await mine(ben, 'HO-2041'))[0].read, true)
  await notifications.mockMarkAllNotificationsRead(ben)
  assert.ok((await mine(ben)).every((n) => n.read))
})

test('3/5/6. Flow 6 actions produce audit events; completion notifies executor and beneficiary', async () => {
  await runToReceiptPending()
  await handover.mockRecordAssetDownload(ben, 'HO-2041', 'ho-asset-will')
  await handover.mockConfirmReceipt(ben, 'HO-2041')

  const actions = (await latest()).filter((e) => e.caseId === 'HO-2041' && e.outcome === 'SUCCESS').map((e) => e.action)
  for (const action of ['HANDOVER_START', 'IDENTITY_VERIFICATION', 'AUTHORIZATION_CHECK', 'ASSET_ACCESS',
    'ASSET_DOWNLOAD', 'RECEIPT_CONFIRMATION', 'HANDOVER_COMPLETED']) {
    assert.ok(actions.includes(action), action)
  }
  const done = (await findAudit('HANDOVER_COMPLETED', 'HO-2041'))[0]
  assert.equal(done.actor.id, ben.id)

  assert.ok((await mine(executor, 'HO-2041')).some((n) => n.type === 'HANDOVER_COMPLETED'))
  assert.ok((await mine(ben, 'HO-2041')).some((n) => n.type === 'HANDOVER_COMPLETED'))
  assert.ok(!(await mine(ben2, 'HO-2041')).length)
})

test('COMPLETED is not written when receipt confirmation fails', async () => {
  await handover.mockStartHandover(executor, 'HO-2041')
  await handover.mockVerifyIdentity(ben, 'HO-2041', verifyForm)
  await handover.mockRunAuthorizationCheck(ben, 'HO-2041')
  await rejectsWith(handover.mockConfirmReceipt(ben, 'HO-2041'), 'INVALID_STATE')
  assert.equal((await handover.mockGetBeneficiaryCase(ben, 'HO-2041')).status, 'READY_FOR_ACCESS')
  assert.equal((await findAudit('HANDOVER_COMPLETED', 'HO-2041')).length, 0)
  assert.ok(!(await mine(executor, 'HO-2041')).some((n) => n.type === 'HANDOVER_COMPLETED'))
})

test('4. failed authorization / asset access is recorded as DENIED without asset content', async () => {
  await handover.mockStartHandover(executor, 'HO-2041')
  await rejectsWith(handover.mockOpenAsset(ben, 'HO-2041', 'ho-asset-will'), 'ACCESS_DENIED')
  await handover.mockVerifyIdentity(ben, 'HO-2041', verifyForm)
  await handover.mockRunAuthorizationCheck(ben, 'HO-2041')
  await rejectsWith(handover.mockOpenAsset(ben, 'HO-2041', 'ho-asset-bank'), 'ACCESS_DENIED')
  await rejectsWith(handover.mockRecordAssetDownload(ben, 'HO-2041', 'ho-asset-bank'), 'ACCESS_DENIED')

  const denied = await findAudit('ASSET_ACCESS', 'HO-2041', 'DENIED')
  assert.equal(denied.length, 2)
  assert.ok(denied.some((e) => e.details.reasons.includes('ASSET_NOT_AUTHORIZED')))
  assert.equal((await findAudit('ASSET_DOWNLOAD', 'HO-2041', 'DENIED')).length, 1)
  const alerts = await latest({ alertsOnly: true })
  assert.ok(alerts.length >= 3)
})

test('verification outcomes are audited; lock notifies beneficiary and executor', async () => {
  await handover.mockStartHandover(executor, 'HO-2041')
  for (let i = 0; i < 5; i += 1) {
    await assert.rejects(handover.mockVerifyIdentity(ben, 'HO-2041', { ...verifyForm, otp: '999999' }))
  }
  const failures = await findAudit('IDENTITY_VERIFICATION', 'HO-2041', 'FAILURE')
  assert.equal(failures.length, 5)
  assert.ok(failures.some((e) => e.severity === 'CRITICAL'))
  assert.ok((await mine(ben, 'HO-2041')).some((n) => n.type === 'VERIFICATION_LOCKED'))
  assert.ok((await mine(executor, 'HO-2041')).some((n) => n.type === 'VERIFICATION_LOCKED_EXECUTOR'))
})

test('10. audit log never contains passwords, OTP, ID numbers, keys or asset content', async () => {
  recordSignIn({ user: ben, identifier: ben.identifier, success: true })
  recordSignIn({ identifier: 'nobody@example.test', success: false, reason: 'INVALID_CREDENTIALS' })
  await handover.mockStartHandover(executor, 'HO-2041')
  await handover.mockVerifyIdentity(ben, 'HO-2041', { ...verifyForm, otp: '424242' }).catch(() => {})
  await runToReceiptPending().catch(() => {})
  await handover.mockVerifyIdentity(ben, 'HO-2041', verifyForm).catch(() => {})
  await handover.mockRunAuthorizationCheck(ben, 'HO-2041').catch(() => {})
  const opened = await handover.mockOpenAsset(ben, 'HO-2041', 'ho-asset-will')
  await handover.mockConfirmReceipt(ben, 'HO-2041')
  await admin.mockAdminSetUserRole(adminUser, ben2.id, 'EXECUTOR')

  const raw = JSON.stringify(await latest())
  for (const secret of [DEMO_PASSWORD, DEMO_OTP_CODE, '424242', '999999', ID_NUMBER, opened.content, 'protectedContent']) {
    assert.ok(!raw.includes(secret), `audit log leaks ${secret}`)
  }
  assert.deepEqual(sanitizeDetails({ password: 'x', otp: '1', privateKey: 'k', seedPhrase: 's', content: 'c', idNumber: '9', ok: 1 }), { ok: 1 })
})

test('login success and failure are audited', async () => {
  recordSignIn({ user: ben, identifier: ben.identifier, success: true })
  recordSignIn({ identifier: 'wrong@example.test', success: false, reason: 'INVALID_CREDENTIALS' })
  const logins = await findAudit('LOGIN')
  assert.equal(logins.length, 2)
  assert.ok(logins.some((e) => e.outcome === 'FAILURE' && e.actor.name === 'wrong@example.test'))
})

test('7/8. non-admins cannot read the audit log or change administration; attempts are audited', async () => {
  for (const u of [ben, executor, owner, verifier]) {
    await rejectsWith(audit.mockListAudit(u), 'ADMIN_ONLY')
    await rejectsWith(admin.mockAdminListUsers(u), 'ADMIN_ONLY')
  }
  await rejectsWith(admin.mockAdminSetPermission(executor, 'EXECUTOR', 'audit.view', true), 'ADMIN_ONLY')
  await rejectsWith(admin.mockAdminSetUserRole(executor, ben.id, 'ADMIN'), 'ADMIN_ONLY')
  const { matrix } = await admin.mockAdminGetPermissions(adminUser)
  assert.ok(!matrix.EXECUTOR.includes('audit.view'))
  assert.ok((await findAudit('PERMISSION_CHANGED', null, 'DENIED')).length === 1)
})

test('9. admin can use every section; user / permission changes are audited and notify affected users', async () => {
  const users = await admin.mockAdminListUsers(adminUser)
  assert.equal(users.length, mockUsers.length)

  await admin.mockAdminSetUserStatus(adminUser, ben2.id, 'SUSPENDED')
  assert.ok((await mine(ben2)).some((n) => n.type === 'ACCOUNT_STATUS_CHANGED'))
  assert.equal((await findAudit('USER_STATUS_CHANGED')).length, 1)
  await rejectsWith(admin.mockAdminSetUserStatus(adminUser, adminUser.id, 'SUSPENDED'), 'SELF_CHANGE')

  await admin.mockAdminSetPermission(adminUser, 'BENEFICIARY', 'legal.review', true)
  const benNotes = (await mine(ben)).filter((n) => n.type === 'PERMISSIONS_CHANGED')
  assert.equal(benNotes.length, 1)
  assert.ok(!(await mine(executor)).some((n) => n.type === 'PERMISSIONS_CHANGED'))
  await rejectsWith(admin.mockAdminSetPermission(adminUser, 'ADMIN', 'users.manage', false), 'LOCKED_PERMISSION')

  await admin.mockAdminSavePolicies(adminUser, { keyRotationDays: 30 })
  await rejectsWith(admin.mockAdminSavePolicies(adminUser, { keyRotationDays: 1 }), 'INVALID_INPUT')
  await admin.mockAdminSetIntegration(adminUser, 'kyc', true)
  assert.ok((await admin.mockAdminListIntegrations(adminUser)).find((i) => i.id === 'kyc').enabled)
  assert.equal((await findAudit('POLICY_CHANGED')).length, 1)
  assert.equal((await findAudit('INTEGRATION_CHANGED')).length, 1)
})

test('Flow 5 hook: legal approval notifies the executor and is audited', async () => {
  await rejectsWith(handover.mockRecordLegalDecision(executor, 'HO-2043', 'APPROVED'), 'WRONG_ROLE')
  const updated = await handover.mockRecordLegalDecision(verifier, 'HO-2043', 'APPROVED')
  assert.equal(updated.status, 'APPROVED')
  assert.ok((await mine(executor, 'HO-2043')).some((n) => n.type === 'LEGAL_APPROVED'))
  assert.equal((await findAudit('LEGAL_STATUS_CHANGED', 'HO-2043', 'SUCCESS')).length, 1)
  assert.equal((await findAudit('LEGAL_STATUS_CHANGED', 'HO-2043', 'DENIED')).length, 1)
  await handover.mockStartHandover(executor, 'HO-2043')
})

test('admin demo reset clears data and records the reset', async () => {
  await handover.mockStartHandover(executor, 'HO-2041')
  await admin.mockAdminResetDemo(adminUser)
  const entries = await latest()
  assert.equal(entries[0].action, 'DEMO_DATA_RESET')
  assert.equal((await mine(ben, 'HO-2041')).length, 0)
})
