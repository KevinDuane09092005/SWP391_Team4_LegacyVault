import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CircleCheck, Download, Eye, FileUp, Info, UploadCloud } from 'lucide-react'
import Button from '../../components/Button.jsx'
import { HandoverLayout } from '../../components/handover/HandoverParts.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { handoverContent } from '../../data/handoverContent.js'
import { verifierContent } from '../../data/verifierContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { listExecutorCases } from '../../services/handoverService.js'
import {
  DEMO_MODE,
  submitCase,
  uploadDocument,
  getDocumentDownloadUrl,
} from '../../services/verificationService.js'
import { DocumentPreviewModal } from '../../components/verifier/VerifierParts.jsx'
import { formatBytes, validateUpload } from '../../vault/verificationRules.js'
import '../../styles/verifier.css'

export default function ExecutorSubmissionPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = verifierContent[language] || verifierContent.en
  const ht = handoverContent[language] || handoverContent.en
  const u = t.executorUpload

  const [searchParams] = useSearchParams()
  const initialCaseId = searchParams.get('caseId') || (DEMO_MODE ? 'LV-1042' : '')
  const [caseId, setCaseId] = useState(initialCaseId)
  const [cases, setCases] = useState([])
  const [file, setFile] = useState(null)
  const [documentNumber, setDocumentNumber] = useState('GCT-12345')
  const [issuedBy, setIssuedBy] = useState('UBND Phường')
  const [issuedDate, setIssuedDate] = useState('2026-10-25')
  const [notes, setNotes] = useState('Kính gửi Chuyên viên pháp lý thẩm định giấy tờ')
  const [autoSubmit, setAutoSubmit] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)

  useEffect(() => {
    if (user) {
      listExecutorCases(user)
        .then((data) => {
          if (Array.isArray(data)) {
            setCases(data)
            if (!caseId && data.length > 0) {
              setCaseId(data[0].legalCaseId || data[0].case_id || data[0].id)
            }
          }
        })
        .catch(() => { })
    }
  }, [user])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess(null)

    if (!caseId.trim()) {
      setError(t.errors.caseIdRequired)
      return
    }

    const validation = validateUpload(file)
    if (validation) {
      setError(validation)
      return
    }

    setBusy(true)
    try {
      const response = await uploadDocument(caseId.trim(), file, {
        document_type: 'DEATH_CERTIFICATE',
        document_number: documentNumber,
        issued_by: issuedBy,
        issued_date: issuedDate,
        documentType: 'DEATH_CERTIFICATE',
        documentNumber,
        issuedBy,
        issuedDate,
      })

      if (autoSubmit) {
        await submitCase(caseId.trim(), { notes })
      }

      setSuccess({
        ...response,
        submitted: autoSubmit,
        notes,
      })
      setFile(null)
    } catch (e) {
      setError(e.message || 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <HandoverLayout>
      <div style={{ marginBottom: '24px' }}>
        <Link
          to="/dashboard/executor"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.875rem',
            color: 'var(--color-primary)',
            textDecoration: 'none',
            marginBottom: '12px',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} />
          <span>{ht.executor.backToDashboard}</span>
        </Link>
        <div>
          <span className="badge badge--accent">{ht.executor.nav}</span>
          <h1 className="page-title">{u.title}</h1>
          <p className="page-text">{u.lead}</p>
        </div>
      </div>

      <div className="executor-grid">
        <section className="feature-panel">
          <div className="feature-heading">
            <span className="feature-symbol">
              <FileUp size={22} />
            </span>
            <div>
              <h2>{u.title}</h2>
              <p>{u.subtitle}</p>
            </div>
          </div>

          <p className="support-copy">{u.lead}</p>

          <form className="upload-form" onSubmit={handleSubmit} noValidate>
            <label className="field-label" htmlFor="submission-case">
              {u.caseLabel}
            </label>

            {cases.length > 0 && (
              <select
                id="submission-case-select"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">-- {ht.executor.selectCasePlaceholder} --</option>
                {cases.map((c) => {
                  const targetId = c.legalCaseId || c.case_id || c.id
                  return (
                    <option key={c.id || targetId} value={targetId}>
                      {c.id} · {c.vault?.owner?.name || c.vault_owner || 'Owner'} ➔ {c.beneficiary?.name || 'Beneficiary'} ({c.legalStatus || c.status})
                    </option>
                  )
                })}
              </select>
            )}

            <input
              id="submission-case"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder={u.casePlaceholder}
              required
            />

            <label className="field-label" htmlFor="upload-file" style={{ marginTop: '14px' }}>
              {u.fileLabel}
            </label>
            <label className="drop-file" htmlFor="upload-file">
              <UploadCloud size={30} strokeWidth={1.5} />
              <strong>{file?.name || u.chooseFile}</strong>
              <small>{file ? formatBytes(file.size) : u.maxSize}</small>
            </label>
            <input
              id="upload-file"
              className="visually-hidden"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null)
                setError('')
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '14px' }}>
              <div>
                <label className="field-label" htmlFor="doc-number">
                  {language === 'vi' ? 'Số giấy chứng tử' : 'Document Number'}
                </label>
                <input
                  id="doc-number"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="GCT-8899/2026"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="doc-issuer">
                  {language === 'vi' ? 'Nơi cấp' : 'Issued By'}
                </label>
                <input
                  id="doc-issuer"
                  value={issuedBy}
                  onChange={(e) => setIssuedBy(e.target.value)}
                  placeholder="UBND Quận 1"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="doc-date">
                  {language === 'vi' ? 'Ngày cấp' : 'Issued Date'}
                </label>
                <input
                  id="doc-date"
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                />
              </div>
            </div>

            <label className="field-label" htmlFor="submission-notes" style={{ marginTop: '14px' }}>
              {language === 'vi' ? 'Ghi chú nộp thẩm định' : 'Submission Notes'}
            </label>
            <input
              id="submission-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'vi' ? 'Kính gửi Chuyên viên pháp lý thẩm định giấy tờ' : 'Notes for verifier'}
            />

            {error && (
              <p className="form-error" role="alert" style={{ marginTop: '12px' }}>
                {error}
              </p>
            )}

            {success && (
              <div
                className="inline-success"
                role="status"
                style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', padding: '16px', borderRadius: '8px', border: '1px solid #86efac', background: '#f0fdf4' }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <CircleCheck size={22} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#15803d', fontSize: '0.95rem' }}>{ht.executor.uploadSuccessTitle || u.successTitle}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#166534' }}>
                      {success.file_name} · {success.submitted
                        ? (language === 'vi'
                          ? 'Hồ sơ đã được nộp thẩm định thành công (Trạng thái: SUBMITTED).'
                          : 'Case submitted successfully for legal verification (Status: SUBMITTED).')
                        : (ht.executor.uploadSuccessMsg || u.successMessage)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setPreviewDoc(success)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={15} />
                    <span>{language === 'vi' ? 'Xem trước tài liệu' : 'Preview Document'}</span>
                  </Button>

                  {(success.document_id || success.id) && (
                    <a
                      href={getDocumentDownloadUrl(success)}
                      className="btn btn-download"
                      target="_blank"
                      rel="noopener noreferrer"
                      download={success.file_name || 'document'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-sm, 6px)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        background: 'var(--color-primary, #2563eb)',
                        color: '#ffffff',
                        textDecoration: 'none',
                      }}
                    >
                      <Download size={15} />
                      <span>{language === 'vi' ? 'Tải về máy' : 'Download file'}</span>
                    </a>
                  )}

                  <Button variant="primary" size="sm" to="/dashboard/executor">
                    {ht.executor.backToDashboard}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setSuccess(null)
                      setFile(null)
                    }}
                  >
                    {ht.executor.uploadAnother}
                  </Button>
                </div>
              </div>
            )}

            <Button
              className="upload-submit"
              variant="primary"
              type="submit"
              disabled={busy}
              style={{ marginTop: '16px' }}
            >
              {busy ? (autoSubmit ? (language === 'vi' ? 'Đang tải lên & nộp...' : 'Uploading & Submitting...') : t.actions.uploading) : (autoSubmit ? (language === 'vi' ? 'Tải lên & Nộp thẩm định' : 'Upload & Submit for Review') : t.actions.upload)}
            </Button>
          </form>
        </section>

        <aside className="support-panel">
          <span className="support-icon">
            <Info size={22} />
          </span>
          <h3>{u.workflowTitle}</h3>
          <p>{u.workflowEndpoint}:</p>
          <code>{u.workflowEndpoint}</code>
          <p style={{ marginTop: '14px', lineHeight: 1.6 }}>{u.workflowNote}</p>
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '14px', fontSize: '0.8125rem' }}>
            <strong>{language === 'vi' ? 'Quy trình thẩm định:' : 'Verification Flow:'}</strong>
            <ol style={{ paddingLeft: '18px', margin: '8px 0 0', display: 'grid', gap: '6px' }}>
              <li>{language === 'vi' ? 'Executor nộp Giấy chứng tử (PDF/Ảnh).' : 'Executor uploads Death Certificate.'}</li>
              <li>{language === 'vi' ? 'Thừa phát lại kiểm tra & Ký số phê duyệt.' : 'Legal Verifier reviews & signs approval.'}</li>
              <li>{language === 'vi' ? 'Executor bắt đầu bàn giao di sản cho Người thụ hưởng.' : 'Executor begins asset handover to beneficiary.'}</li>
            </ol>
          </div>
        </aside>
      </div>

      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          t={t}
        />
      )}
    </HandoverLayout>
  )
}

