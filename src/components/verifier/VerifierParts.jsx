import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Download,
  FileText,
  Info,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react'
import Button from '../Button.jsx'
import {
  canReview,
  validRejectReason,
} from '../../vault/verificationRules.js'
import {
  DEMO_MODE,
  getDocumentViewUrl,
  getDocumentDownloadUrl,
} from '../../services/verificationService.js'
import { getAuthToken, downloadBlob } from '../../services/apiClient.js'

export function StatusBadge({ status, t }) {
  const key = (status || 'PENDING').toUpperCase()
  const label = t?.statusLabels?.[key] || key
  return (
    <span className={`status status-${key.toLowerCase()}`}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  )
}

export function CaseCard({ record, active, onClick, t }) {
  const caseNumber = record.case_number || record.caseNumber || record.case_id || record.caseId || '—'
  const ownerName = record.vault_owner_name || record.vaultOwnerName || '—'
  const executorName = record.executor_name || record.executorName || '—'
  const submittedDate =
    record.submitted_date_formatted ||
    record.submittedDateFormatted ||
    record.submitted_date ||
    record.submittedDate ||
    '—'

  return (
    <button
      type="button"
      className={`case-card ${active ? 'case-card--active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="case-cell">
        <strong>Case #{caseNumber}</strong>
        <small>{t.table.owner} · {ownerName}</small>
      </span>
      <span className="case-cell">
        <span className="case-cell-label">{t.table.executor}</span>
        <strong>{executorName}</strong>
      </span>
      <span className="case-cell">
        <span className="case-cell-label">{t.table.submitted}</span>
        <span>{submittedDate}</span>
      </span>
      <span className="case-badge-col">
        <StatusBadge status={record.status} t={t} />
      </span>
    </button>
  )
}

export function DocumentCard({ document, onView, t }) {
  return (
    <button
      type="button"
      className="document-card"
      onClick={() => onView(document)}
      title={`View ${document.file_name}`}
    >
      <span className="document-icon">
        <FileText size={20} strokeWidth={1.8} />
      </span>
      <span className="document-copy">
        <strong>{document.file_name}</strong>
        <small>
          {t.dialogs.uploadedBy(document.uploaded_by, document.file_size_formatted)}
        </small>
      </span>
      <ChevronRight size={16} className="document-chevron" />
    </button>
  )
}

export function Modal({ title, children, onClose, wide = false }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        className={`modal ${wide ? 'modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-heading">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

export function CaseDetail({ record, onApprove, onReject, onView, working, t }) {
  const docs = record.documents || []
  const status = String(record.status || '').toUpperCase()
  const isApproved = status === 'APPROVED'
  const isRejected = status === 'REJECTED'
  const caseNumber = record.case_number || record.caseNumber || record.case_id || record.caseId || '—'

  return (
    <section
      className="case-detail-section"
      aria-label={`${caseNumber} details`}
    >
      <h2>{t.detail.detailTitle(caseNumber)}</h2>
      <div className="detail-panel">
        <div className="document-well">
          {docs.length ? (
            docs.map((doc, i) => (
              <DocumentCard
                key={doc.document_id || doc.documentId || i}
                document={doc}
                onView={onView}
                t={t}
              />
            ))
          ) : (
            <div className="document-placeholder">
              <FileText size={20} />
              <span>{t.table.noDocuments}</span>
            </div>
          )}
        </div>

        <div className="detail-info">
          {isApproved ? (
            <div className="decision-message approved-message">
              <div className="decision-title">
                <span className="decision-icon">
                  <Check size={16} strokeWidth={2.8} />
                </span>
                <strong>{record.approved_title || record.approvedTitle || t.detail.approvedTitle}</strong>
              </div>
              <p>
                {record.approved_message ||
                  record.approvedMessage ||
                  t.detail.approvedDefaultMessage(caseNumber)}
              </p>
              {DEMO_MODE && (
                <span className="demo-footnote">{t.demoFootnote}</span>
              )}
            </div>
          ) : isRejected ? (
            <div className="decision-message rejected-message">
              <div className="decision-title">
                <span className="decision-icon">
                  <X size={16} strokeWidth={2.8} />
                </span>
                <strong>{t.detail.rejectedTitle}</strong>
              </div>
              <p>
                {record.rejection_reason || record.rejectionReason || t.detail.rejectedDefaultMessage}
              </p>
              <span className="decision-secondary">
                {t.detail.rejectedSecondary}
              </span>
            </div>
          ) : (
            <>
              <p className="guideline">
                {record.review_guideline || record.reviewGuideline || t.detail.guideline}
              </p>
              <div className="decision-actions">
                <Button
                  variant="primary"
                  disabled={
                    working || !canReview(record.status) || !docs.length
                  }
                  onClick={onApprove}
                >
                  {t.actions.approve}
                </Button>
                <Button
                  variant="secondary"
                  disabled={working || !canReview(record.status)}
                  onClick={onReject}
                >
                  {t.actions.reject}
                </Button>
              </div>
              {!docs.length && (
                <div style={{ marginTop: '12px', fontSize: '0.8125rem', color: '#b45309', background: '#fef3c7', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #fde68a' }}>
                  <Info size={16} style={{ flexShrink: 0, color: '#d97706' }} />
                  <span>
                    {t?.detail?.noDocsHint || 'Legal document (Death Certificate) must be uploaded by the Executor before this case can be reviewed or approved.'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export function ApproveDialog({ record, close, confirm, working, error, t }) {
  const [note, setNote] = useState('')
  const [pin, setPin] = useState('')
  const [checked, setChecked] = useState(false)

  return (
    <Modal title={t.dialogs.approveTitle} onClose={close}>
      <div className="modal-body">
        <div className="dialog-lead">
          <ShieldCheck size={22} />
          <span>{t.dialogs.approveLead(record.case_number)}</span>
        </div>

        <label className="field-label" htmlFor="signature-note">
          {t.dialogs.verificationNote}{' '}
          <span className="field-optional">{t.dialogs.optional}</span>
        </label>
        <textarea
          id="signature-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.dialogs.notePlaceholder}
          maxLength={1000}
        />

        <label className="field-label" htmlFor="verifier-pin">
          {t.dialogs.verifierPin}{' '}
          <span className="field-optional">{t.dialogs.pinOptional}</span>
        </label>
        <input
          id="verifier-pin"
          type="password"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder={t.dialogs.pinPlaceholder}
        />

        <label className="confirm-check">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>{t.dialogs.confirmCheck}</span>
        </label>

        {DEMO_MODE && (
          <p className="inline-note">
            <Info size={14} />
            <span>{t.dialogs.approveDemoNote}</span>
          </p>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <footer className="modal-actions">
        <Button variant="secondary" onClick={close} disabled={working}>
          {t.actions.cancel}
        </Button>
        <Button
          variant="primary"
          disabled={!checked || working}
          onClick={() =>
            confirm({ signature_note: note.trim(), verifier_pin: pin })
          }
        >
          {working ? t.actions.processing : t.actions.approve}
        </Button>
      </footer>
    </Modal>
  )
}

export function RejectDialog({ record, close, confirm, working, error, t }) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)

  return (
    <Modal title={t.dialogs.rejectTitle(record.case_number)} onClose={close}>
      <div className="modal-body">
        <p className="modal-instruction">{t.dialogs.rejectInstruction}</p>

        <label className="field-label" htmlFor="rejection-reason">
          {t.dialogs.rejectionReason}{' '}
          <span className="field-required">{t.dialogs.required}</span>
        </label>
        <textarea
          id="rejection-reason"
          rows={4}
          value={reason}
          onBlur={() => setTouched(true)}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t.dialogs.reasonPlaceholder}
          maxLength={1000}
        />

        {touched && !validRejectReason(reason) && (
          <p className="form-error">{t.dialogs.reasonMinLength}</p>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <footer className="modal-actions">
        <Button variant="secondary" onClick={close} disabled={working}>
          {t.actions.cancel}
        </Button>
        <Button
          variant="danger"
          disabled={working || !validRejectReason(reason)}
          onClick={() => confirm(reason.trim())}
        >
          {working ? t.actions.processing : t.actions.reject}
        </Button>
      </footer>
    </Modal>
  )
}

export function DocumentPreviewModal({ doc, onClose, t }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [rawBlob, setRawBlob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const fileName = (doc?.file_name || doc?.fileName || '').toLowerCase()
  const isPdf =
    fileName.endsWith('.pdf') ||
    doc?.mime_type?.includes('pdf') ||
    (!fileName.match(/\.(png|jpe?g|webp|gif|svg)$/i) && doc?.document_type === 'DEATH_CERTIFICATE')
  const isImage =
    !isPdf &&
    (fileName.match(/\.(png|jpe?g|webp|gif|svg)$/i) ||
      doc?.mime_type?.startsWith('image/'))

  const viewUrl = getDocumentViewUrl(doc)
  const downloadUrl = getDocumentDownloadUrl(doc)

  useEffect(() => {
    let active = true
    let createdUrl = null

    if (!doc) return

    const directUrl = doc.file_url || doc.fileUrl
    if (directUrl && (directUrl.startsWith('blob:') || directUrl.startsWith('data:'))) {
      setBlobUrl(directUrl)
      return
    }

    if (!viewUrl || DEMO_MODE) {
      return
    }

    setLoading(true)
    setLoadError(null)

    const token = getAuthToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    fetch(viewUrl, { headers })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText || 'Không thể tải tệp tin'}`)
        }
        return res.blob()
      })
      .then((blob) => {
        if (!active) return
        setRawBlob(blob)
        createdUrl = URL.createObjectURL(blob)
        setBlobUrl(createdUrl)
      })
      .catch((err) => {
        if (!active) return
        setLoadError(err.message || 'Lỗi khi tải tài liệu')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [doc, viewUrl])

  const handleDownload = async (e) => {
    e.preventDefault()
    if (rawBlob) {
      downloadBlob(rawBlob, doc.file_name || 'document.pdf')
      return
    }
    setDownloading(true)
    try {
      const token = getAuthToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(downloadUrl, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      downloadBlob(blob, doc.file_name || 'document.pdf')
    } catch {
      window.open(downloadUrl, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  const activeUrl = blobUrl || viewUrl
  const hasLiveUrl = Boolean(activeUrl && (!DEMO_MODE || activeUrl.startsWith('blob:') || activeUrl.startsWith('data:')))

  return (
    <Modal title={t?.dialogs?.previewTitle || 'Xem trước tài liệu'} onClose={onClose} wide={true}>
      <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="file-preview-title" style={{ textAlign: 'left', margin: 0, fontSize: '1.05rem' }}>
              {doc.file_name || 'Legal Document'}
            </h3>
            <p className="preview-description" style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>
              {t?.dialogs?.uploadedBy
                ? t.dialogs.uploadedBy(doc.uploaded_by, doc.file_size_formatted)
                : `Uploaded by ${doc.uploaded_by || 'Executor'} · ${doc.file_size_formatted || '—'}`}
            </p>
          </div>
          {(doc.document_number || doc.issued_by) && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {doc.document_number && (
                <span className="badge badge--accent" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                  No: {doc.document_number}
                </span>
              )}
              {doc.issued_by && (
                <span className="badge" style={{ fontSize: '0.75rem', padding: '3px 8px', background: 'var(--color-surface-muted)' }}>
                  {doc.issued_by}
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              background: 'var(--color-surface-muted, #f8fafc)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <RefreshCw className="spin" size={32} style={{ color: 'var(--color-primary, #2563eb)' }} />
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-muted)' }}>
              Đang tải tài liệu bảo mật từ server...
            </p>
          </div>
        ) : loadError ? (
          <div
            style={{
              padding: '30px 20px',
              textAlign: 'center',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
            }}
          >
            <CircleAlert size={36} style={{ margin: '0 auto 10px', color: '#dc2626' }} />
            <h4 style={{ margin: '0 0 6px', color: '#991b1b' }}>Không thể hiển thị xem trước</h4>
            <p style={{ margin: '0 0 14px', fontSize: '0.875rem' }}>{loadError}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-download"
                onClick={handleDownload}
                style={{ fontSize: '0.8125rem' }}
              >
                <Download size={14} />
                <span>Tải về máy để xem</span>
              </button>
            </div>
          </div>
        ) : hasLiveUrl ? (
          isPdf ? (
            <div className="document-preview-container pdf-preview">
              <iframe
                src={activeUrl}
                width="100%"
                height="600px"
                title="Document Preview"
                style={{
                  width: '100%',
                  height: '600px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  background: '#ffffff',
                }}
              />
            </div>
          ) : (
            <div
              className="document-preview-container image-preview"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'var(--color-surface-muted, #f8fafc)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                maxHeight: '620px',
                overflow: 'auto',
              }}
            >
              <img
                src={activeUrl}
                alt={doc.file_name || 'Document Preview'}
                className="max-w-full h-auto rounded"
                style={{
                  maxWidth: '100%',
                  maxHeight: '580px',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              />
            </div>
          )
        ) : (
          <div
            style={{
              padding: '28px',
              borderRadius: '8px',
              border: '1px dashed var(--color-border)',
              background: 'var(--color-surface-muted, #f8fafc)',
              textAlign: 'center',
            }}
          >
            <div className="file-preview-icon" style={{ margin: '0 auto 12px' }}>
              <FileText size={36} />
            </div>
            <h4 style={{ margin: '0 0 6px', color: 'var(--color-heading)' }}>
              {doc.file_name || 'Death_Certificate.pdf'}
            </h4>
            <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
              {doc.document_type || 'DEATH_CERTIFICATE'} · {doc.file_size_formatted || '2.1 MB'}
            </p>
            <p className="inline-note" style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'left' }}>
              <Info size={15} />
              <span>{t?.dialogs?.previewDemoNote || 'Preview file trực tiếp từ server backend hoặc file đã tải lên.'}</span>
            </p>
          </div>
        )}
      </div>
      <footer className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {(doc.document_id || doc.id) && (
            <button
              type="button"
              className="btn btn-download"
              onClick={handleDownload}
              disabled={downloading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm, 6px)',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                background: 'var(--color-primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Download size={16} />
              <span>{downloading ? 'Đang tải...' : (t?.actions?.download || 'Tải về máy')}</span>
            </button>
          )}
        </div>
        <Button variant="secondary" onClick={onClose}>
          {t?.actions?.close || 'Đóng'}
        </Button>
      </footer>
    </Modal>
  )
}
