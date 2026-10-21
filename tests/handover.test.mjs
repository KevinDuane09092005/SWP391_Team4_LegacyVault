// Flow 6 business rules, run with: node --test tests/
// Uses the demo store directly (it falls back to in-memory storage outside the browser).
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { mockUsers } from '../src/mocks/mockUsers.js'
import * as store from '../src/mocks/mockHandoverStore.js'
import { checkAssetAccess, DENY } from '../src/handover/handoverAccess.js'
import { mockListMyNotifications, resetNotifications } from '../src/mocks/mockNotificationStore.js'
import { resetAudit } from '../src/mocks/mockAuditStore.js'

const user = (id) => mockUsers.find((item) => item.id === id)
const executor = user('demo-executor')
const ben = user('demo-beneficiary')
const ben2 = user('demo-beneficiary-2')
const owner = user('demo-owner')
const verifyForm = { otp: '123456', fullName: 'Demo Beneficiary', idNumber: '012345678901' }

const rejectsWith = (promise, code) => assert.rejects(promise, (error) => error.code === code)

beforeEach(() => {
  store.mockResetHandovers()
  resetNotifications()
  resetAudit()
})

test('1. cannot start before Legal Verification is APPROVED', async () => {
  await rejectsWith(store.mockStartHandover(executor, 'HO-2042'), 'LEGAL_NOT_APPROVED')
  await rejectsWith(store.mockStartHandover(executor, 'HO-2039'), 'LEGAL_NOT_APPROVED')

  // TC01: the status must not move to HANDOVER_INITIATED and nobody is notified.
  const cases = await store.mockListExecutorCases(executor)
  const pending = cases.find((c) => c.id === 'HO-2042')
  const rejected = cases.find((c) => c.id === 'HO-2039')
  assert.equal(pending.legalStatus, 'UNDER_REVIEW')
  assert.equal(pending.status, 'PENDING_LEGAL_APPROVAL')
  assert.equal(rejected.legalStatus, 'REJECTED')
  assert.equal(rejected.status, 'REJECTED')
  for (const handover of [pending, rejected]) {
    assert.equal(handover.beneficiary.userId, null)
    assert.deepEqual(handover.timeline, [])
  }
  const notified = (await mockListMyNotifications(ben)).map((n) => n.caseId)
  const visible = (await store.mockListBeneficiaryCases(ben)).map((c) => c.id)
  for (const id of ['HO-2042', 'HO-2043', 'HO-2039']) {
    assert.ok(!notified.includes(id) && !visible.includes(id), id)
  }
})

test('2. can start after approval; beneficiary is identified and notified', async () => {
  const started = await store.mockStartHandover(executor, 'HO-2041')
  assert.equal(started.status, 'BENEFICIARY_VERIFICATION_PENDING')
  assert.equal(started.beneficiary.userId, 'demo-beneficiary')
  const notes = (await mockListMyNotifications(ben)).filter((n) => n.caseId === 'HO-2041')
  assert.equal(notes.length, 1)
  assert.equal((await mockListMyNotifications(ben2)).length, 0)
  await rejectsWith(store.mockStartHandover(executor, 'HO-2041'), 'ALREADY_STARTED')
})

test('no matching beneficiary / no authorized asset blocks the start', async () => {
  await rejectsWith(store.mockStartHandover(executor, 'HO-2045'), 'BENEFICIARY_NOT_FOUND')
  await rejectsWith(store.mockStartHandover(executor, 'HO-2046'), 'NO_AUTHORIZED_ASSETS')
})

test('3/4/5. only the assigned, signed-in beneficiary sees the case', async () => {
  await store.mockStartHandover(executor, 'HO-2041')
  assert.deepEqual((await store.mockListBeneficiaryCases(ben)).map((c) => c.id), ['HO-2041', 'HO-2047', 'HO-2048'])
  assert.deepEqual(await store.mockListBeneficiaryCases(ben2), [])
  await rejectsWith(store.mockGetBeneficiaryCase(ben2, 'HO-2041'), 'CASE_NOT_FOUND')
  await rejectsWith(store.mockGetBeneficiaryCase(null, 'HO-2041'), 'NOT_SIGNED_IN')
  await rejectsWith(store.mockGetBeneficiaryCase(owner, 'HO-2041'), 'WRONG_ROLE')
  await rejectsWith(store.mockGetBeneficiaryCase(executor, 'HO-2041'), 'WRONG_ROLE')
})

test('6/7. no access before verification; failed verification keeps access closed', async () => {
  await store.mockStartHandover(executor, 'HO-2041')
  await rejectsWith(store.mockOpenAsset(ben, 'HO-2041', 'ho-asset-will'), 'ACCESS_DENIED')
  await rejectsWith(store.mockVerifyIdentity(ben, 'HO-2041', { ...verifyForm, otp: '000000' }), 'VERIFICATION_FAILED')
  await rejectsWith(store.mockVerifyIdentity(ben, 'HO-2041', { ...verifyForm, fullName: 'Someone Else' }), 'VERIFICATION_FAILED')
  await rejectsWith(store.mockRunAuthorizationCheck(ben, 'HO-2041'), 'INVALID_STATE')
  await rejectsWith(store.mockOpenAsset(ben, 'HO-2041', 'ho-asset-will'), 'ACCESS_DENIED')
})

test('verification locks after 5 failed attempts', async () => {
  await store.mockStartHandover(executor, 'HO-2041')
  for (let i = 0; i < 4; i += 1) {
    await rejectsWith(store.mockVerifyIdentity(ben, 'HO-2041', { ...verifyForm, otp: '111111' }), 'VERIFICATION_FAILED')
  }
  await rejectsWith(store.mockVerifyIdentity(ben, 'HO-2041', { ...verifyForm, otp: '111111' }), 'VERIFICATION_LOCKED')
  await rejectsWith(store.mockVerifyIdentity(ben, 'HO-2041', verifyForm), 'VERIFICATION_LOCKED')
})

test('8–13. full flow: only own assets, receipt completes once, access closes after', async () => {
  await store.mockStartHandover(executor, 'HO-2041')
  const verified = await store.mockVerifyIdentity(ben, 'HO-2041', verifyForm)
  assert.equal(verified.status, 'IDENTITY_VERIFIED')
  await rejectsWith(store.mockOpenAsset(ben, 'HO-2041', 'ho-asset-will'), 'ACCESS_DENIED') // auth check not run yet
  const ready = await store.mockRunAuthorizationCheck(ben, 'HO-2041')
  assert.equal(ready.status, 'READY_FOR_ACCESS')
  assert.deepEqual(ready.assets.map((a) => a.id), ['ho-asset-will', 'ho-asset-facebook'])
  assert.ok(ready.assets.every((a) => !('protectedContent' in a)))

  // 8/9. asset of another beneficiary in the same case
  await assert.rejects(store.mockOpenAsset(ben, 'HO-2041', 'ho-asset-bank'),
    (error) => error.code === 'ACCESS_DENIED' && error.details.reasons.includes(DENY.ASSET_NOT_AUTHORIZED))

  // 10. permitted asset
  const opened = await store.mockOpenAsset(ben, 'HO-2041', 'ho-asset-will')
  assert.match(opened.content, /^DEMO:/)
  assert.equal(opened.case.status, 'RECEIPT_PENDING')

  // 11/12/13
  const done = await store.mockConfirmReceipt(ben, 'HO-2041')
  assert.equal(done.status, 'COMPLETED')
  assert.ok(done.completedAt)
  await rejectsWith(store.mockConfirmReceipt(ben, 'HO-2041'), 'ALREADY_COMPLETED')
  await rejectsWith(store.mockOpenAsset(ben, 'HO-2041', 'ho-asset-will'), 'ACCESS_DENIED')

  const forExecutor = (await store.mockListExecutorCases(executor)).find((c) => c.id === 'HO-2041')
  assert.equal(forExecutor.status, 'COMPLETED')
  assert.ok(forExecutor.assets.every((a) => !('protectedContent' in a)))
})

test('cannot confirm receipt before any asset was accessed', async () => {
  await store.mockStartHandover(executor, 'HO-2041')
  await store.mockVerifyIdentity(ben, 'HO-2041', verifyForm)
  await store.mockRunAuthorizationCheck(ben, 'HO-2041')
  await rejectsWith(store.mockConfirmReceipt(ben, 'HO-2041'), 'INVALID_STATE')
})

test('executor-only actions reject other roles', async () => {
  await rejectsWith(store.mockStartHandover(ben, 'HO-2041'), 'WRONG_ROLE')
  await rejectsWith(store.mockListExecutorCases(ben), 'WRONG_ROLE')
})

test('central check reports every failing condition', () => {
  const handover = { beneficiary: { userId: 'demo-beneficiary' }, status: 'BENEFICIARY_VERIFICATION_PENDING',
    legalStatus: 'APPROVED', verification: {}, assets: [{ id: 'a', authorizedBeneficiaryIds: ['x'] }] }
  const { allowed, reasons } = checkAssetAccess(ben, handover, 'a')
  assert.equal(allowed, false)
  assert.deepEqual(reasons, [DENY.IDENTITY_NOT_VERIFIED, DENY.AUTHORIZATION_NOT_CHECKED, DENY.ASSET_NOT_AUTHORIZED])
})

test('seed: PENDING legal case cannot start', async () => {
  await rejectsWith(store.mockStartHandover(executor, 'HO-2043'), 'LEGAL_NOT_APPROVED')
  const handover = (await store.mockListExecutorCases(executor)).find((c) => c.id === 'HO-2043')
  assert.equal(handover.legalStatus, 'PENDING')
  assert.equal(handover.status, 'PENDING_LEGAL_APPROVAL')
})

test('seed: HO-2047 waits for verification and hides the other beneficiary asset', async () => {
  const handover = await store.mockGetBeneficiaryCase(ben, 'HO-2047')
  assert.equal(handover.status, 'BENEFICIARY_VERIFICATION_PENDING')
  assert.deepEqual(handover.assets.map((a) => a.id), ['ho-asset-cloud'])
  assert.ok((await mockListMyNotifications(ben)).some((n) => n.caseId === 'HO-2047' && !n.read))
  await rejectsWith(store.mockGetBeneficiaryCase(ben2, 'HO-2047'), 'CASE_NOT_FOUND')
  await rejectsWith(store.mockOpenAsset(ben, 'HO-2047', 'ho-asset-cloud'), 'ACCESS_DENIED')
  await rejectsWith(store.mockOpenAsset(ben, 'HO-2047', 'ho-asset-game'), 'ACCESS_DENIED')
  await rejectsWith(store.mockStartHandover(executor, 'HO-2047'), 'ALREADY_STARTED')
})

test('seed: HO-2048 is COMPLETED, cannot complete again, access closed', async () => {
  const handover = await store.mockGetBeneficiaryCase(ben, 'HO-2048')
  assert.equal(handover.status, 'COMPLETED')
  assert.equal(handover.completedAt, '2026-10-10T10:20:00.000Z')
  await rejectsWith(store.mockConfirmReceipt(ben, 'HO-2048'), 'ALREADY_COMPLETED')
  await assert.rejects(store.mockOpenAsset(ben, 'HO-2048', 'ho-asset-letter'),
    (error) => error.code === 'ACCESS_DENIED' && error.details.reasons.includes(DENY.HANDOVER_COMPLETED))
  const forExecutor = (await store.mockListExecutorCases(executor)).find((c) => c.id === 'HO-2048')
  assert.equal(forExecutor.status, 'COMPLETED')
})
