import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  FileText,
  Info,
  LockKeyhole,
  ShieldCheck,
  X,
} from 'lucide-react'
import Button from '../Button.jsx'
import {
  canReview,
  validRejectReason,
} from '../../vault/verificationRules.js'
import { DEMO_MODE } from '../../services/verificationService.js'

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
  return (
    <Modal title={t.dialogs.previewTitle} onClose={onClose}>
      <div className="modal-body">
        <div className="file-preview-icon">
          <FileText size={32} />
        </div>
        <h3 className="file-preview-title">{doc.file_name}</h3>
        <p className="preview-description">
          {t.dialogs.uploadedBy(doc.uploaded_by, doc.file_size_formatted)}
        </p>

        {doc.file_url && !DEMO_MODE ? (
          <>
            <p className="inline-note">
              <LockKeyhole size={15} />
              <span>{t.dialogs.protectedNote}</span>
            </p>
            <a
              className="btn btn--primary modal-file-link"
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.dialogs.openSecureDoc}
            </a>
          </>
        ) : (
          <p className="inline-note">
            <Info size={15} />
            <span>{t.dialogs.previewDemoNote}</span>
          </p>
        )}
      </div>
      <footer className="modal-actions">
        <Button variant="secondary" onClick={onClose}>
          {t.actions.close}
        </Button>
      </footer>
    </Modal>
  )
}
