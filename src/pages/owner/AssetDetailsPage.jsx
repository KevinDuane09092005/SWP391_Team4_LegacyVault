import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import Icon from '../../components/Icon.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import { Breadcrumbs, ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { vaultContent } from '../../data/vaultContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getAsset } from '../../services/vaultService.js'
import { getAssignmentByAssetIdApi } from '../../services/assignmentService.js'
import { getTypeFields } from '../../vault/assetTypes.js'
import { formatFileSize } from '../../vault/documentRules.js'
import { formatDisplayDate, formatDisplayDateTime, formatFieldValue } from '../../vault/format.js'
import { ownerPaths } from '../../vault/paths.js'

const initials = (str) => {
  if (!str) return '?'
  const parts = str.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Flow 2 — Asset Details: Displays asset information, decrypted credentials,
// attachment documents, security status, and handover configuration fetched from
// GET /api/v1/assets/{assetId} and GET /api/v1/assignments/asset/{assetId}
export default function AssetDetailsPage({ assetId: propAssetId, onClose, isModal = false }) {
  const params = useParams()
  const assetId = propAssetId || params.assetId
  const vaultId = params.vaultId || 'vault-demo-family'

  const { user } = useAuth()
  const { language } = useLanguage()
  const t = vaultContent[language]
  const copy = t.assetDetails
  const location = useLocation()
  const navigate = useNavigate()

  const [assetData, setAssetData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCredentials, setShowCredentials] = useState(false)
  const [copied, setCopied] = useState(false)

  // Handover Assignment state for this asset
  const [assignment, setAssignment] = useState(null)
  const [loadingAssignment, setLoadingAssignment] = useState(true)
  const [assignmentError, setAssignmentError] = useState(null)

  // Fetch asset details by assetId and token from localStorage
  const fetchAssetDetail = useCallback(async () => {
    if (!assetId) return
    setLoading(true)
    setError(null)

    // 1. Kiểm tra Token từ localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
    if (!token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    try {
      // 2. Gọi API lấy chi tiết tài sản (đã tích hợp backend GET /api/v1/assets/{assetId})
      const data = await getAsset(user?.id, vaultId, assetId)
      setAssetData(data)
    } catch (err) {
      // 3. Xử lý khi Token hết hạn (401 / 403)
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('legacyvault-access-token')
        navigate('/login', {
          state: {
            from: location.pathname,
            message:
              language === 'vi'
                ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
                : 'Session expired. Please log in again.',
          },
        })
        return
      }

      console.error('Lỗi lấy chi tiết tài sản:', err)
      setError(
        err.message ||
          (language === 'vi'
            ? 'Không tìm thấy tài sản hoặc quyền truy cập bị từ chối.'
            : 'Asset not found or access denied.'),
      )
    } finally {
      setLoading(false)
    }
  }, [assetId, language, location.pathname, navigate, user?.id, vaultId])

  // Fetch assignment configuration by assetId: GET /api/v1/assignments/asset/{assetId}
  const fetchAssignmentDetail = useCallback(async () => {
    if (!assetId) return
    setLoadingAssignment(true)
    setAssignmentError(null)

    const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
    if (!token) {
      setLoadingAssignment(false)
      return
    }

    try {
      const data = await getAssignmentByAssetIdApi(assetId)
      setAssignment(data)
    } catch (err) {
      // If 404, asset is unassigned - not a fatal crash
      setAssignment(null)
      setAssignmentError(err)

      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('legacyvault-access-token')
        navigate('/login', {
          state: {
            from: location.pathname,
            message:
              language === 'vi'
                ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
                : 'Session expired. Please log in again.',
          },
        })
      }
    } finally {
      setLoadingAssignment(false)
    }
  }, [assetId, language, location.pathname, navigate])

  // Lắng nghe theo assetId để gọi API khi mở trang hoặc mở modal
  useEffect(() => {
    fetchAssetDetail()
    fetchAssignmentDetail()
  }, [fetchAssetDetail, fetchAssignmentDetail])

  const handleCopyCredentials = (text) => {
    if (!text) return
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Trạng thái Loading
  if (loading) {
    const loadingView = <LoadingState label={t.loading} />
    return isModal ? (
      <div className="flow-modal-overlay">
        <div className="flow-modal">{loadingView}</div>
      </div>
    ) : (
      <OwnerLayout>{loadingView}</OwnerLayout>
    )
  }

  // Trạng thái Lỗi
  if (error || !assetData) {
    const errorView = (
      <ErrorState message={error || t.errors.generic} retryLabel={t.retry} onRetry={fetchAssetDetail}>
        {onClose ? (
          <Button onClick={onClose} variant="secondary">
            {language === 'vi' ? 'Đóng' : 'Close'}
          </Button>
        ) : (
          <Button to={ownerPaths.assets} variant="secondary">
            {language === 'vi' ? 'Quay lại danh sách tài sản' : 'Back to Assets'}
          </Button>
        )}
      </ErrorState>
    )

    return isModal ? (
      <div className="flow-modal-overlay" onMouseDown={onClose}>
        <div className="flow-modal" onMouseDown={(e) => e.stopPropagation()}>
          {errorView}
        </div>
      </div>
    ) : (
      <OwnerLayout>{errorView}</OwnerLayout>
    )
  }

  const { asset } = assetData
  const assetName = asset.assetName || asset.name
  const assetType = asset.assetType || asset.type
  const isAssigned = !!assignment || asset.status === 'assigned'
  const typeFields = getTypeFields(assetType) || []

  const content = (
    <>
      {!isModal && (
        <Breadcrumbs
          label={t.breadcrumbsLabel}
          items={[
            { label: language === 'vi' ? 'Tài sản của tôi' : 'My Assets', to: ownerPaths.assets },
            { label: assetName },
          ]}
        />
      )}

      {location.state?.saved && <FormAlert tone="success">{location.state?.message || copy.saved}</FormAlert>}

      <div className="page-head page-head--spaced">
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span className="badge">{t.assetTypes[assetType] || assetType}</span>
            <span className={`badge ${isAssigned ? 'green' : 'amber'}`}>
              {isAssigned
                ? (language === 'vi' ? 'Đã phân bổ' : 'Assigned')
                : (language === 'vi' ? 'Chưa phân bổ' : 'Unassigned')}
            </span>
          </div>
          <h1 className="page-title">{assetName}</h1>
          <p className="page-meta">
            {copy.created} {formatDisplayDateTime(asset.createdAt)}
            {asset.updatedAt && asset.updatedAt !== asset.createdAt && (
              <> · {language === 'vi' ? 'Cập nhật' : 'Updated'} {formatDisplayDateTime(asset.updatedAt)}</>
            )}
          </p>
        </div>
        <div className="page-head__actions">
          {onClose ? (
            <Button onClick={onClose} variant="secondary">
              {language === 'vi' ? 'Đóng' : 'Close'}
            </Button>
          ) : (
            <>
              <Button to={ownerPaths.assets} variant="secondary">
                {language === 'vi' ? 'Quay lại danh sách tài sản' : 'Back to Assets'}
              </Button>
              <Button to={ownerPaths.newAsset()}>{language === 'vi' ? 'Đăng ký tài sản khác' : 'Add Another Asset'}</Button>
            </>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <section className="card detail-card" aria-labelledby="info-title">
          <h2 id="info-title" className="section-title">
            {copy.information}
          </h2>
          <dl className="detail-list">
            <div>
              <dt>{copy.type}</dt>
              <dd>{t.assetTypes[assetType] || assetType}</dd>
            </div>
            <div>
              <dt>{language === 'vi' ? 'Trạng thái' : 'Status'}</dt>
              <dd>
                <span className={`badge ${isAssigned ? 'green' : 'amber'}`}>
                  {isAssigned
                    ? (language === 'vi' ? 'Đã phân bổ' : 'Assigned')
                    : (language === 'vi' ? 'Chưa phân bổ' : 'Unassigned')}
                </span>
              </dd>
            </div>
            {asset.details && typeFields.map((field) => (
              <div key={field.name}>
                <dt>{t.fields[field.name]?.label || field.name}</dt>
                <dd>{formatFieldValue(field, asset.details[field.name], t)}</dd>
              </div>
            ))}
            <div>
              <dt>{copy.description}</dt>
              <dd>{asset.description || t.empty}</dd>
            </div>
            {asset.handoverNotes && (
              <div>
                <dt>{copy.handoverNotes}</dt>
                <dd className="detail-list__long">{asset.handoverNotes}</dd>
              </div>
            )}
            {asset.decryptedCredentials && (
              <div>
                <dt>{language === 'vi' ? 'Thông tin bảo mật' : 'Credentials'}</dt>
                <dd>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: showCredentials ? 'inherit' : 'monospace',
                        letterSpacing: showCredentials ? 'normal' : '2px',
                        wordBreak: 'break-all',
                        backgroundColor: 'var(--color-surface-subtle)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {showCredentials ? asset.decryptedCredentials : '••••••••••••••••••••'}
                    </span>
                    <button
                      type="button"
                      className="field__reveal"
                      onClick={() => setShowCredentials((v) => !v)}
                      title={showCredentials ? (language === 'vi' ? 'Ẩn' : 'Hide') : (language === 'vi' ? 'Hiện' : 'Show')}
                      aria-label={showCredentials ? (language === 'vi' ? 'Ẩn' : 'Hide') : (language === 'vi' ? 'Hiện' : 'Show')}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: 'var(--color-muted)',
                      }}
                    >
                      <Icon name={showCredentials ? 'eyeOff' : 'eye'} size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(asset.decryptedCredentials)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title={language === 'vi' ? 'Sao chép mật khẩu' : 'Copy credentials'}
                    >
                      <Icon name={copied ? 'check' : 'copy'} size={14} />
                      <span>
                        {copied
                          ? (language === 'vi' ? 'Đã sao chép' : 'Copied')
                          : (language === 'vi' ? 'Sao chép' : 'Copy')}
                      </span>
                    </button>
                  </div>
                </dd>
              </div>
            )}
            <div>
              <dt>{copy.created}</dt>
              <dd>{formatDisplayDateTime(asset.createdAt)}</dd>
            </div>
            {asset.updatedAt && (
              <div>
                <dt>{language === 'vi' ? 'Cập nhật lần cuối' : 'Last updated'}</dt>
                <dd>{formatDisplayDateTime(asset.updatedAt)}</dd>
              </div>
            )}
          </dl>
        </section>

        <div className="detail-side">
          {/* Card: Cấu hình bàn giao di sản (Handover & Assignment Details) */}
          <section className="card detail-card" aria-labelledby="handover-title">
            <h2 id="handover-title" className="section-title">
              {language === 'vi' ? 'Cấu hình bàn giao di sản' : 'Handover Configuration'}
            </h2>

            {loadingAssignment ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <LoadingState
                  label={language === 'vi' ? 'Đang tải cấu hình bàn giao…' : 'Loading handover details…'}
                />
              </div>
            ) : !assignment || assignmentError?.status === 404 || asset.status === 'unassigned' ? (
              // Trạng thái tài sản chưa được bàn giao (404 Not Found)
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'var(--color-surface-muted)',
                    color: 'var(--color-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <Icon name="layers" size={22} />
                </div>
                <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--color-heading)', fontSize: '0.9375rem' }}>
                  {language === 'vi' ? 'Tài sản này chưa được thiết lập bàn giao' : 'Asset Not Assigned Yet'}
                </p>
                <p style={{ margin: '0 0 16px', color: 'var(--color-muted)', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                  {language === 'vi'
                    ? 'Chỉ định người thụ hưởng và người thi hành để bảo vệ và kích hoạt quy trình bàn giao tài sản khi cần thiết.'
                    : 'Assign designated beneficiaries and an executor to protect and handover this asset.'}
                </p>
                <Button to={`/dashboard/owner/assignments?new=true&assetId=${assetId}`} size="sm">
                  <Icon name="plus" size={14} />
                  {language === 'vi' ? 'Thiết lập bàn giao' : 'Assign now'}
                </Button>
              </div>
            ) : (
              // Trạng thái tài sản ĐÃ có cấu hình bàn giao (200 OK)
              <div>
                {/* 1. Người thi hành (Executor) */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-muted)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '8px',
                    }}
                  >
                    {language === 'vi' ? 'Người thi hành (Executor)' : 'Executor'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="person-initial" style={{ width: '34px', height: '34px', fontSize: '0.75rem' }}>
                      {initials(assignment.executorName)}
                    </span>
                    <div>
                      <b style={{ display: 'block', fontSize: '0.875rem', color: 'var(--color-heading)' }}>
                        {assignment.executorName}
                      </b>
                      <small style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>
                        {assignment.executorEmail || '—'}
                      </small>
                    </div>
                  </div>
                </div>

                {/* 2. Người thụ hưởng (Beneficiaries) */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-muted)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '8px',
                    }}
                  >
                    {language === 'vi' ? 'Người thụ hưởng (Beneficiaries)' : 'Beneficiaries'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {assignment.beneficiaries?.map((b) => (
                      <div
                        key={b.contactId || b.id || b.email}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          background: 'var(--color-surface-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <span
                          className="person-initial"
                          style={{
                            width: '28px',
                            height: '28px',
                            fontSize: '0.6875rem',
                            background: '#CCFBF1',
                            color: '#0D9488',
                            flexShrink: 0,
                          }}
                        >
                          {initials(b.fullName || b.name)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-heading)' }}>
                            {b.fullName || b.name}
                            {b.relationship && (
                              <span style={{ fontWeight: 400, color: 'var(--color-muted)', marginLeft: '6px' }}>
                                ({b.relationship})
                              </span>
                            )}
                          </div>
                          {b.email && (
                            <small style={{ color: 'var(--color-muted)', fontSize: '0.75rem', display: 'block' }}>
                              {b.email}
                            </small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Chỉ dẫn bàn giao (Handover Instructions & Conditions) */}
                {assignment.handoverInstructions && (
                  <div style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-muted)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '6px',
                      }}
                    >
                      {language === 'vi' ? 'Chỉ dẫn bàn giao (Instructions)' : 'Handover Instructions'}
                    </div>
                    <div
                      style={{
                        background: 'var(--color-surface-subtle)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 12px',
                        fontSize: '0.8125rem',
                        lineHeight: 1.6,
                        color: 'var(--color-text)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {assignment.handoverInstructions}
                    </div>
                  </div>
                )}

                {/* 4. Ngày tạo cấu hình (Configured Date) */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: '0.75rem',
                    color: 'var(--color-muted)',
                  }}
                >
                  <span>{language === 'vi' ? 'Ngày thiết lập hồ sơ:' : 'Configured on:'}</span>
                  <b style={{ color: 'var(--color-heading)' }}>{formatDisplayDate(assignment.createdAt)}</b>
                </div>
              </div>
            )}
          </section>

          {/* Card: Related documents */}
          <section className="card detail-card" aria-labelledby="docs-title">
            <h2 id="docs-title" className="section-title">
              {copy.documents}
            </h2>
            {asset.attachmentUrl ? (
              <ul className="file-list file-list--compact">
                <li className="file-list__item">
                  <Icon name="fileText" size={18} />
                  <span className="file-list__name">
                    <a
                      href={asset.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                      style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}
                    >
                      {asset.attachmentUrl.split('/').pop() || (language === 'vi' ? 'Tài liệu đính kèm' : 'Attached document')}
                    </a>
                  </span>
                  <a
                    href={asset.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '12px', padding: '3px 8px', textDecoration: 'none' }}
                  >
                    {language === 'vi' ? 'Xem / Tải tệp' : 'View / Download'}
                  </a>
                </li>
              </ul>
            ) : asset.relatedDocuments && asset.relatedDocuments.length > 0 ? (
              <ul className="file-list file-list--compact">
                {asset.relatedDocuments.map((document) => (
                  <li key={document.id} className="file-list__item">
                    <Icon name="fileText" size={18} />
                    <span className="file-list__name">{document.name}</span>
                    <span className="file-list__size">{formatFileSize(document.size)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="review-box__muted">{copy.noDocuments}</p>
            )}
            {asset.relatedDocuments && asset.relatedDocuments.length > 0 && !asset.attachmentUrl && (
              <p className="detail-note">{copy.notUploaded}</p>
            )}
          </section>

          {/* Card: Security & Encryption */}
          <section className="card detail-card" aria-labelledby="security-title">
            <h2 id="security-title" className="section-title">
              {copy.security}
            </h2>
            <p className="detail-warning">
              <Icon name={asset.decryptedCredentials ? 'shieldCheck' : 'alertCircle'} size={16} />
              <span>
                {asset.decryptedCredentials
                  ? (language === 'vi'
                      ? 'Dữ liệu bảo mật đã được mã hóa AES-256 an toàn và giải mã tự động cho chủ sở hữu.'
                      : 'Secured with AES-256 encryption and decrypted safely for vault owner.')
                  : copy.notEncrypted}
              </span>
            </p>
            {asset.decryptedCredentials && (
              <>
                <p className="detail-note">
                  {language === 'vi' ? 'Trường bảo mật được mã hóa:' : 'Encrypted sensitive fields:'}
                </p>
                <ul className="sensitive-list">
                  <li>
                    <Icon name="lock" size={14} />
                    {language === 'vi' ? 'Mật khẩu / Khóa khôi phục' : 'Password / Recovery keys'}
                  </li>
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  )

  if (isModal) {
    return (
      <div className="flow-modal-overlay" onMouseDown={onClose}>
        <div className="flow-modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
          {content}
        </div>
      </div>
    )
  }

  return <OwnerLayout>{content}</OwnerLayout>
}
