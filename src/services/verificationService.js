import {
  STATUS_LABELS,
  canReview,
  matchesQuery,
} from '../vault/verificationRules.js'
import {
  clearMockCases,
  loadMockCases,
  saveMockCases,
} from '../mocks/mockVerificationStore.js'
import { appendAudit, actorOf } from '../mocks/mockAuditStore.js'
import { AUDIT_ACTIONS, OUTCOME } from '../audit/auditRules.js'
import { pushNotification } from '../mocks/mockNotificationStore.js'
import { mockRecordLegalDecision } from '../mocks/mockHandoverStore.js'
import { mockUsers } from '../mocks/mockUsers.js'

import { IS_DEMO_MODE, apiFetch } from './apiClient.js'

export const DEMO_MODE = IS_DEMO_MODE
export { IS_DEMO_MODE }

let customTokenProvider = null

export function configureTokenProvider(provider) {
  if (typeof provider !== 'function') {
    throw new Error('Provide a function that returns the current access token.')
  }
  customTokenProvider = provider
}

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = (value) => JSON.parse(JSON.stringify(value))

async function request(method, path, body) {
  return apiFetch(path, {
    method,
    ...(body !== undefined ? { body } : {}),
  })
}

export function adaptVerifierCase(r) {
  if (!r) return r
  const cid = r.caseId || r.case_id || r.id
  const cnum = r.caseNumber || r.case_number || cid
  let rawStatus = (r.status || 'PENDING').toUpperCase()
  if (rawStatus === 'INITIATED') {
    rawStatus = 'UNDER_REVIEW'
  }
  return {
    ...r,
    case_id: cid,
    caseId: cid,
    case_number: cnum,
    caseNumber: cnum,
    vault_owner_name: r.vaultOwnerName || r.vault_owner_name || '—',
    vaultOwnerName: r.vaultOwnerName || r.vault_owner_name || '—',
    executor_name: r.executorName || r.executor_name || '—',
    executorName: r.executorName || r.executor_name || '—',
    submitted_date: r.submittedDate || r.submitted_date || '—',
    submittedDate: r.submittedDate || r.submitted_date || '—',
    submitted_date_formatted:
      r.submittedDateFormatted ||
      r.submitted_date_formatted ||
      r.submittedDate ||
      r.submitted_date ||
      '—',
    submittedDateFormatted:
      r.submittedDateFormatted ||
      r.submitted_date_formatted ||
      r.submittedDate ||
      r.submitted_date ||
      '—',
    status: rawStatus,
    status_label: r.statusLabel || r.status_label || STATUS_LABELS[rawStatus] || rawStatus,
    statusLabel: r.statusLabel || r.status_label || STATUS_LABELS[rawStatus] || rawStatus,
    documents_count: r.documentsCount ?? r.documents_count ?? (Array.isArray(r.documents) ? r.documents.length : 0),
    documents: Array.isArray(r.documents) ? r.documents : [],
    rejection_reason: r.rejectionReason || r.rejection_reason || null,
    review_guideline: r.reviewGuideline || r.review_guideline || null,
  }
}

export async function listCases({ status = 'ALL', search = '', page = 0, size = 10 } = {}) {
  if (!DEMO_MODE) {
    const params = new URLSearchParams({
      status,
      search,
      page: String(page),
      size: String(size),
    })
    const res = await request('GET', `/legal-verification/verifier/queue?${params}`)
    const rawList = Array.isArray(res) ? res : (res?.content || res?.cases || res?.data || [])
    const mapped = rawList.map(adaptVerifierCase)
    return {
      content: mapped,
      total_elements: res?.total_elements || res?.totalElements || mapped.length,
      total_pages: res?.total_pages || res?.totalPages || 1,
    }
  }

  await delay()
  const all = loadMockCases().filter(
    (r) => (status === 'ALL' || r.status === status) && matchesQuery(r, search)
  )
  const start = page * size

  return {
    content: all.slice(start, start + size).map((r) => ({
      case_id: r.case_id,
      case_number: r.case_number,
      vault_owner_name: r.vault_owner_name,
      executor_name: r.executor_name,
      submitted_date: r.submitted_date,
      submitted_date_formatted: r.submitted_date_formatted,
      status: r.status,
      status_label: STATUS_LABELS[r.status] || r.status,
      documents_count: r.documents?.length || 0,
    })),
    total_elements: all.length,
    total_pages: Math.ceil(all.length / size),
  }
}

export async function getCaseDetail(caseId) {
  if (!DEMO_MODE) {
    const raw = await request('GET', `/legal-verification/cases/${encodeURIComponent(caseId)}`)
    return adaptVerifierCase(raw)
  }

  await delay()
  const r = loadMockCases().find((item) => item.case_id === caseId || item.case_number === caseId)
  if (!r) throw new Error('Case not found.')
  return clone(r)
}

export async function startReview(caseId) {
  if (!DEMO_MODE) {
    return request('POST', `/legal-verification/cases/${encodeURIComponent(caseId)}/start-review`)
  }
  await delay()
  return { caseId, status: 'UNDER_REVIEW' }
}

export async function submitCase(caseId, { notes = 'Kính gửi Chuyên viên pháp lý thẩm định giấy tờ' } = {}) {
  if (!DEMO_MODE) {
    return request('POST', `/legal-verification/cases/${encodeURIComponent(caseId)}/submit`, {
      notes,
      submission_notes: notes,
    })
  }
  await delay()
  return { caseId, status: 'SUBMITTED', notes }
}

export async function approveCase(caseId, { signature_note = '', signatureNote = '', verifier_pin = '', verifierSignaturePayload = '' } = {}, currentUser = null) {
  if (!DEMO_MODE) {
    const noteText = signatureNote || signature_note || 'Giấy chứng tử đã đối soát hợp lệ với cơ sở dữ liệu quốc gia. Chấp thuận cấp quyền bàn giao di sản.'
    const sigPayload = verifierSignaturePayload || verifier_pin || 'VERIFIER_SIGN_SHA256_VALIDATED_OK'
    return request('POST', `/legal-verification/cases/${encodeURIComponent(caseId)}/approve`, {
      signatureNote: noteText,
      verifierSignaturePayload: sigPayload,
      ...(verifier_pin ? { verifierPin: verifier_pin } : {}),
    })
  }

  await delay()
  const data = loadMockCases()
  const record = data.find((r) => r.case_id === caseId || r.case_number === caseId)
  if (!record) throw new Error('Case not found.')
  if (!canReview(record.status)) {
    throw new Error('This case cannot be approved in its current state.')
  }

  record.status = 'APPROVED'
  record.status_label = 'Approved'
  record.approved_title = 'Case approved'
  record.approved_message = `Document verified successfully. Case #${record.case_number} was approved and vault unlock has been authorized.`
  record.vault_unlock_authorized = true
  record.verified_at = new Date().toISOString()
  if (signature_note || signatureNote) record.signature_note = signatureNote || signature_note

  saveMockCases(data)

  // Integration with Flow 7 (Audit & Notifications)
  const verifierUser = currentUser || mockUsers.find((u) => u.id === 'demo-verifier')
  try {
    appendAudit({
      actor: actorOf(verifierUser),
      action: AUDIT_ACTIONS.LEGAL_STATUS_CHANGED,
      outcome: OUTCOME.SUCCESS,
      entity: { type: 'LEGAL_CASE', id: record.case_number },
      caseId: record.case_number,
      details: { legalStatus: 'APPROVED', signature_note: signatureNote || signature_note },
    })

    const executor = mockUsers.find((u) => u.role === 'EXECUTOR')
    if (executor) {
      pushNotification({
        userId: executor.id,
        type: 'LEGAL_APPROVED',
        params: { caseId: record.case_number, legalCaseId: record.case_number },
        caseId: record.case_number,
      })
    }
  } catch {
    // Non-fatal in testing or demo
  }

  // Cross-link with Flow 6 handover if a matching case exists
  try {
    if (record.case_number === 'LV-1043' || caseId === 'LV-1043') {
      await mockRecordLegalDecision(verifierUser, 'HO-2043', 'APPROVED').catch(() => null)
    }
  } catch {
    // ignore
  }

  return {
    case_id: record.case_id,
    case_number: record.case_number,
    status: record.status,
    status_label: record.status_label,
    approved_title: record.approved_title,
    approved_message: record.approved_message,
    vault_unlock_authorized: true,
    verified_at: record.verified_at,
  }
}

export async function rejectCase(caseId, reason, currentUser = null) {
  if (!DEMO_MODE) {
    return request('POST', `/legal-verification/cases/${encodeURIComponent(caseId)}/reject`, { reason })
  }

  await delay()
  const data = loadMockCases()
  const record = data.find((r) => r.case_id === caseId || r.case_number === caseId)
  if (!record) throw new Error('Case not found.')
  if (!canReview(record.status)) {
    throw new Error('This case cannot be rejected in its current state.')
  }

  record.status = 'REJECTED'
  record.status_label = 'Rejected'
  record.rejection_reason = reason
  record.vault_unlock_authorized = false
  saveMockCases(data)

  // Integration with Flow 7
  const verifierUser = currentUser || mockUsers.find((u) => u.role === 'LEGAL_VERIFIER')
  try {
    appendAudit({
      actor: actorOf(verifierUser),
      action: AUDIT_ACTIONS.LEGAL_STATUS_CHANGED,
      outcome: OUTCOME.SUCCESS,
      entity: { type: 'LEGAL_CASE', id: record.case_number },
      caseId: record.case_number,
      details: { legalStatus: 'REJECTED', reason },
    })

    const executor = mockUsers.find((u) => u.role === 'EXECUTOR')
    if (executor) {
      pushNotification({
        userId: executor.id,
        type: 'LEGAL_REJECTED',
        params: { caseId: record.case_number, reason },
        caseId: record.case_number,
      })
    }
  } catch {
    // Non-fatal
  }

  return {
    case_id: record.case_id,
    case_number: record.case_number,
    status: 'REJECTED',
    rejection_reason: reason,
  }
}

export async function uploadDocument(caseId, file, meta = {}) {
  if (!DEMO_MODE) {
    const data = new FormData()
    data.append('file', file)
    data.append('document_type', meta.documentType || meta.document_type || 'DEATH_CERTIFICATE')
    data.append('document_number', meta.documentNumber || meta.document_number || 'GCT-8899/2026')
    data.append('issued_by', meta.issuedBy || meta.issued_by || 'UBND Quận 1')
    data.append('issued_date', meta.issuedDate || meta.issued_date || '2026-10-15')
    data.append('documentType', meta.documentType || 'DEATH_CERTIFICATE')
    data.append('documentNumber', meta.documentNumber || 'GCT-8899/2026')
    data.append('issuedBy', meta.issuedBy || 'UBND Quận 1')
    data.append('issuedDate', meta.issuedDate || '2026-10-15')
    return request(
      'POST',
      `/legal-verification/cases/${encodeURIComponent(caseId)}/documents`,
      data,
      true
    )
  }

  await delay()
  const data = loadMockCases()
  const record = data.find((r) => r.case_id === caseId || r.case_number === caseId)
  if (!record) throw new Error('Case not found.')

  const newDoc = {
    document_id: `demo-${Date.now()}`,
    document_type: 'DEATH_CERTIFICATE',
    file_name: file.name,
    file_size_formatted: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    uploaded_by: 'Executor',
    file_url: null,
  }

  record.documents = [...(record.documents || []), newDoc]
  record.documents_count = record.documents.length
  saveMockCases(data)
  return newDoc
}

export function resetDemoCases() {
  clearMockCases()
}
