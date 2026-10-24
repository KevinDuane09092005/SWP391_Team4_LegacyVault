// Flow 5 — Legal Verification tests.
// Run with: node --test tests/flow5.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  VALID_STATUSES,
  canReview,
  formatBytes,
  matchesQuery,
  validateUpload,
  validRejectReason,
} from '../src/vault/verificationRules.js'
import * as api from '../src/services/verificationService.js'

// 1. Business rules tests
test('all five contract statuses are supported', () => {
  assert.deepEqual(VALID_STATUSES, [
    'PENDING',
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
  ])
})

test('only submitted and under review cases allow review', () => {
  assert.equal(canReview('UNDER_REVIEW'), true)
  assert.equal(canReview('SUBMITTED'), true)
  for (const v of ['APPROVED', 'REJECTED', 'PENDING']) {
    assert.equal(canReview(v), false)
  }
})

test('reject reason must be meaningful (at least 5 non-whitespace chars)', () => {
  assert.equal(validRejectReason(''), false)
  assert.equal(validRejectReason('  a  '), false)
  assert.equal(validRejectReason('Illegible document'), true)
})

test('only supported extension and content types accepted', () => {
  for (const type of [
    { name: 'death.pdf', type: 'application/pdf' },
    { name: 'photo.png', type: 'image/png' },
    { name: 'photo.jpg', type: 'image/jpeg' },
  ]) {
    assert.equal(validateUpload({ ...type, size: 15 * 1024 * 1024 }), null)
  }
  assert.match(
    validateUpload({ name: 'secret.exe', type: 'application/octet-stream', size: 99 }),
    /PDF/
  )
  assert.match(
    validateUpload({ name: 'fake.pdf', type: 'application/octet-stream', size: 99 }),
    /PDF/
  )
  assert.match(
    validateUpload({ name: 'too-large.pdf', type: 'application/pdf', size: 15 * 1024 * 1024 + 1 }),
    /15 MB/
  )
  assert.match(
    validateUpload({ name: 'empty.pdf', type: 'application/pdf', size: 0 }),
    /empty/
  )
  assert.match(validateUpload(null), /choose/)
})

test('search by case number, owner name, executor name', () => {
  const item = {
    case_number: 'LV-1042',
    vault_owner_name: 'Thanh Pham',
    executor_name: 'Linh Pham',
  }
  for (const s of ['LV-1042', 'thanh', 'LINH', '']) {
    assert.equal(matchesQuery(item, s), true)
  }
  assert.equal(matchesQuery(item, 'Maya'), false)
})

test('file byte formatting is stable', () => {
  assert.equal(formatBytes(120), '120 B')
  assert.equal(formatBytes(1024), '1.0 KB')
  assert.equal(formatBytes(1024 * 1024), '1.0 MB')
})

// 2. Verification Service demo flow
test('demo API supports queue list, approve, reject, and document upload', async () => {
  api.resetDemoCases()

  let queue = await api.listCases({ status: 'ALL', page: 0, size: 10 })
  assert.ok(queue.total_elements >= 2)
  assert.equal(queue.content[0].case_number, 'LV-1042')
  assert.equal(queue.content[0].status, 'UNDER_REVIEW')

  const current = queue.content[0]
  let detail = await api.getCaseDetail(current.case_id)
  assert.equal(detail.documents[0].file_name, 'Death_Certificate_ThanhPham.pdf')
  assert.equal(detail.documents[0].file_url, null)

  await assert.rejects(() => api.rejectCase('non-existent-case', 'Some reason'))

  const approved = await api.approveCase(current.case_id, { signature_note: 'Checked' })
  assert.equal(approved.status, 'APPROVED')
  assert.equal(approved.vault_unlock_authorized, true)

  detail = await api.getCaseDetail(current.case_id)
  assert.equal(detail.status, 'APPROVED')

  // Cannot reject an already approved case
  await assert.rejects(() => api.rejectCase(current.case_id, 'Reason to reject'))

  // Reset and test rejection
  api.resetDemoCases()
  const rejected = await api.rejectCase(current.case_id, 'Document cannot be verified.')
  assert.equal(rejected.status, 'REJECTED')
  assert.equal(
    (await api.getCaseDetail(current.case_id)).rejection_reason,
    'Document cannot be verified.'
  )

  // Reset and test upload
  api.resetDemoCases()
  const upload = await api.uploadDocument(current.case_id, {
    name: 'death-certificate.pdf',
    size: 1024 * 1024,
  })
  assert.equal(upload.file_url, null)
  detail = await api.getCaseDetail(current.case_id)
  assert.equal(detail.documents.length, 2)
  assert.equal(detail.status, 'UNDER_REVIEW')

  const filter = await api.listCases({ status: 'APPROVED', search: 'Maya' })
  assert.equal(filter.total_elements, 1)

  api.resetDemoCases()
})
