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

export function getDocumentViewUrl(doc) {
  if (!doc) return ''
  const fileUrl = typeof doc === 'string' ? doc : (doc.file_url || doc.fileUrl)
  if (fileUrl) {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
      return fileUrl
    }
    const base = (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
      (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) ||
      'http://localhost:8080'
    ).replace(/\/$/, '').replace(/\/api\/v1$/, '')
    const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
    return `${base || 'http://localhost:8080'}${path}`
  }
  const id = typeof doc === 'object' ? (doc.document_id || doc.documentId || doc.id) : null
  if (id) {
    const base = (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
      (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) ||
      'http://localhost:8080'
    ).replace(/\/$/, '').replace(/\/api\/v1$/, '')
    return `${base || 'http://localhost:8080'}/api/v1/legal-verification/documents/${id}/view`
  }
  return ''
}

export function getDocumentDownloadUrl(doc) {
  if (!doc) return '#'
  const id = typeof doc === 'object' ? (doc.document_id || doc.documentId || doc.id) : doc
  if (!id) return '#'
  const base = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) ||
    'http://localhost:8080'
  ).replace(/\/$/, '').replace(/\/api\/v1$/, '')
  return `${base || 'http://localhost:8080'}/api/v1/legal-verification/documents/${id}/download`
}

export function adaptVerifierDocument(doc) {
  if (!doc) return doc
  const docId = doc.document_id || doc.documentId || doc.id
  const fileName = doc.file_name || doc.fileName || 'document.pdf'
  const fileUrl = doc.file_url || doc.fileUrl || (docId && !DEMO_MODE ? `/api/v1/legal-verification/documents/${docId}/view` : (doc.file_url || null))
  return {
    ...doc,
    document_id: docId,
    documentId: docId,
    document_type: doc.document_type || doc.documentType || 'DEATH_CERTIFICATE',
    documentType: doc.document_type || doc.documentType || 'DEATH_CERTIFICATE',
    document_number: doc.document_number || doc.documentNumber || '',
    documentNumber: doc.document_number || doc.documentNumber || '',
    issued_by: doc.issued_by || doc.issuedBy || '',
    issuedBy: doc.issued_by || doc.issuedBy || '',
    issued_date: doc.issued_date || doc.issuedDate || '',
    issuedDate: doc.issued_date || doc.issuedDate || '',
    file_name: fileName,
    fileName: fileName,
    file_size_formatted:
      doc.file_size_formatted ||
      doc.fileSizeFormatted ||
      (doc.file_size || doc.fileSize
        ? `${((doc.file_size || doc.fileSize) / 1024 / 1024).toFixed(1)} MB`
        : '—'),
    fileSizeFormatted:
      doc.file_size_formatted ||
      doc.fileSizeFormatted ||
      (doc.file_size || doc.fileSize
        ? `${((doc.file_size || doc.fileSize) / 1024 / 1024).toFixed(1)} MB`
        : '—'),
    uploaded_by: doc.uploaded_by || doc.uploadedBy || 'Executor',
    uploadedBy: doc.uploaded_by || doc.uploadedBy || 'Executor',
    file_url: fileUrl,
    fileUrl: fileUrl,
  }
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
    documents: Array.isArray(r.documents) ? r.documents.map(adaptVerifierDocument) : [],
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
  const docType = meta.document_type || meta.documentType || 'DEATH_CERTIFICATE'
  const docNumber = meta.document_number || meta.documentNumber || 'GCT-12345'
  const issuer = meta.issued_by || meta.issuedBy || 'UBND Phường'
  const issueDate = meta.issued_date || meta.issuedDate || '2026-10-25'

  if (!DEMO_MODE) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', docType)
    formData.append('document_number', docNumber)
    formData.append('issued_by', issuer)
    formData.append('issued_date', issueDate)

    const res = await request(
      'POST',
      `/legal-verification/cases/${encodeURIComponent(caseId)}/documents`,
      formData
    )
    return adaptVerifierDocument(res)
  }

  await delay()
  const data = loadMockCases()
  const record = data.find((r) => r.case_id === caseId || r.case_number === caseId)
  if (!record) throw new Error('Case not found.')

  let localUrl = null
  if (typeof window !== 'undefined' && window.URL && typeof Blob !== 'undefined' && file instanceof Blob) {
    try {
      localUrl = window.URL.createObjectURL(file)
    } catch {
      // ignore
    }
  }

  const docId = `demo-${Date.now()}`
  const newDoc = {
    document_id: docId,
    documentId: docId,
    document_type: docType,
    documentType: docType,
    document_number: docNumber,
    documentNumber: docNumber,
    issued_by: issuer,
    issuedBy: issuer,
    issued_date: issueDate,
    issuedDate: issueDate,
    file_name: file.name,
    file_size_formatted: file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : '1.0 MB',
    uploaded_by: 'Executor',
    file_url: localUrl,
  }

  record.documents = [...(record.documents || []), newDoc]
  record.documents_count = record.documents.length
  saveMockCases(data)
  return newDoc
}

export function resetDemoCases() {
  clearMockCases()
}
