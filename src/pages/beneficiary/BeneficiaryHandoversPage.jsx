import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  Gift,
  Globe,
  KeyRound,
  Landmark,
  Layers,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import Button from '../../components/Button.jsx'
import Icon from '../../components/Icon.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import FormField from '../../components/auth/FormField.jsx'
import { HandoverLayout, HandoverStatusBadge } from '../../components/handover/HandoverParts.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { handoverContent, handoverErrorText } from '../../data/handoverContent.js'
import { HANDOVER_STATUS, hasReached } from '../../handover/handoverStatus.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { listBeneficiaryCases, requestHandoverOtpApi } from '../../services/handoverService.js'

function getMilestoneDoneCount(status) {
  if (status === HANDOVER_STATUS.REJECTED) return null
  if (status === HANDOVER_STATUS.COMPLETED) return 4
  if (
    hasReached(status, HANDOVER_STATUS.READY_FOR_ACCESS) ||
    hasReached(status, HANDOVER_STATUS.RECEIPT_PENDING) ||
    status === 'READY_FOR_HANDOVER'
  ) {
    return 3
  }
  if (
    hasReached(status, HANDOVER_STATUS.IDENTITY_VERIFIED) ||
    hasReached(status, HANDOVER_STATUS.AUTHORIZATION_CHECKED)
  ) {
    return 2
  }
  return 1
}

function AssetCategoryIcon({ category }) {
  if (category === 'BANK_ACCOUNT') return <Landmark size={13} aria-hidden="true" />
  if (category === 'IMPORTANT_DOCUMENT') return <FileText size={13} aria-hidden="true" />
  if (category === 'SOCIAL_MEDIA') return <Globe size={13} aria-hidden="true" />
  return <KeyRound size={13} aria-hidden="true" />
}

// Flow 6 — Beneficiary dashboard: full-width inheritance handovers overview assigned to the signed-in beneficiary.
export default function BeneficiaryHandoversPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const isVi = language === 'vi'
  const navigate = useNavigate()
  const t = handoverContent[language]
  const { status, data: cases, error, reload } = useAsync(() => listBeneficiaryCases(user), user?.id)

  // State for the Access Code Verification Modal (with overlay)
  const [selectedCaseForClaim, setSelectedCaseForClaim] = useState(null)
  const [claimEmail, setClaimEmail] = useState('')
  const [claimAccessCode, setClaimAccessCode] = useState('')
  const [claimLoading, setClaimLoading] = useState(false)
  const [claimError, setClaimError] = useState(null)
  const [claimSuccess, setClaimSuccess] = useState(null)

  useEffect(() => {
    if (!selectedCaseForClaim) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape' && !claimLoading) setSelectedCaseForClaim(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedCaseForClaim, claimLoading])

  const handleOpenCase = (handover) => {
    // If identity has already been verified, navigate directly to case details
    if (hasReached(handover.status, HANDOVER_STATUS.IDENTITY_VERIFIED)) {
      navigate(`/dashboard/beneficiary/handover/${handover.id}`)
      return
    }

    // Otherwise, show the Access Code Verification modal with overlay
    setSelectedCaseForClaim(handover)
    setClaimEmail(user?.identifier || user?.email || '')
    setClaimAccessCode('')
    setClaimError(null)
    setClaimSuccess(null)
  }

  const handleClaimSubmit = async (e) => {
    e.preventDefault()
    setClaimError(null)
    setClaimSuccess(null)

    if (!claimEmail.trim() || !claimAccessCode.trim()) {
      setClaimError(
        isVi
          ? 'Vui lòng nhập đầy đủ Email và Mã truy cập bàn giao.'
          : 'Please enter Email and Handover Access Code.',
      )
      return
    }

    setClaimLoading(true)
    try {
      const res = await requestHandoverOtpApi({
        email: claimEmail.trim(),
        accessCode: claimAccessCode.trim(),
        caseRef: selectedCaseForClaim.id,
      })
      const token = res.claim_session_token || res.sessionToken || res.claimToken
      if (token) {
        sessionStorage.setItem('claim_session_token_' + selectedCaseForClaim.id, token)
      }
      setClaimSuccess(
        isVi
          ? 'Mã xác thực OTP đã được gửi đến email của bạn!'
          : 'Verification OTP has been sent to your email!',
      )
      setTimeout(() => {
        const targetId = selectedCaseForClaim.id
        setSelectedCaseForClaim(null)
        navigate(`/dashboard/beneficiary/handover/${targetId}`)
      }, 1000)
    } catch (err) {
      setClaimError(
        err.message ||
          (isVi ? 'Mã truy cập hoặc email không hợp lệ.' : 'Invalid email or access code.'),
      )
    } finally {
      setClaimLoading(false)
    }
  }

  const totalCases = cases?.length ?? 0
  const completedCount = (cases || []).filter((c) => c.status === HANDOVER_STATUS.COMPLETED).length
  const actionRequiredCount = (cases || []).filter(
    (c) => c.status !== HANDOVER_STATUS.COMPLETED && c.status !== HANDOVER_STATUS.REJECTED,
  ).length
  const totalAssetsCount = (cases || []).reduce((sum, c) => sum + (c.assets?.length || 0), 0)

  const stepLabels = isVi
    ? ['Khởi tạo bàn giao', 'Xác thực danh tính', 'Mở khóa tài sản', 'Hoàn tất nhận']
    : ['Handover Started', 'Identity Verified', 'Assets Unlocked', 'Completed']

  const displayName = user?.fullName || user?.name || user?.identifier || user?.email

  return (
    <HandoverLayout>
      <section className="beneficiary-hero">
        <div className="beneficiary-hero__copy">
          <div className="beneficiary-hero__meta">
            <span className="badge">
              <ShieldCheck size={14} style={{ marginRight: 6 }} aria-hidden="true" />
              {isVi ? 'Cổng tiếp nhận di sản số' : 'Digital Inheritance Portal'}
            </span>
            {displayName && (
              <span className="beneficiary-hero__user">
                <User size={13} aria-hidden="true" />
                {displayName}
              </span>
            )}
          </div>
          <h1 className="page-title">{t.beneficiary.title}</h1>
          <p className="page-text">{t.beneficiary.text}</p>
        </div>

        <div className="beneficiary-hero__emblem" aria-hidden="true">
          <Gift size={30} strokeWidth={1.75} />
        </div>
      </section>

      {status === 'loading' && <LoadingState label={t.loading} />}
      {status === 'error' && (
        <ErrorState message={handoverErrorText(t, error)} retryLabel={t.retry} onRetry={reload} />
      )}

      {status === 'ready' && (
        <>
          <section
            className="beneficiary-kpi-grid"
            aria-label={isVi ? 'Tổng quan bàn giao' : 'Handover summary'}
          >
            <article className="card beneficiary-kpi-card">
              <span className="beneficiary-kpi-card__icon" aria-hidden="true">
                <FolderOpen size={20} />
              </span>
              <div className="beneficiary-kpi-card__body">
                <span className="beneficiary-kpi-card__label">
                  {isVi ? 'Hồ sơ được chỉ định' : 'Assigned Cases'}
                </span>
                <strong className="beneficiary-kpi-card__value">{totalCases}</strong>
                <span className="beneficiary-kpi-card__hint">
                  {isVi
                    ? `${completedCount} hồ sơ đã hoàn tất`
                    : `${completedCount} completed`}
                </span>
              </div>
            </article>

            <article className="card beneficiary-kpi-card">
              <span
                className={`beneficiary-kpi-card__icon ${
                  actionRequiredCount > 0
                    ? 'beneficiary-kpi-card__icon--amber'
                    : 'beneficiary-kpi-card__icon--neutral'
                }`}
                aria-hidden="true"
              >
                <Clock size={20} />
              </span>
              <div className="beneficiary-kpi-card__body">
                <span className="beneficiary-kpi-card__label">
                  {isVi ? 'Cần bạn xử lý' : 'Action Required'}
                </span>
                <strong className="beneficiary-kpi-card__value">{actionRequiredCount}</strong>
                <span className="beneficiary-kpi-card__hint">
                  {actionRequiredCount > 0
                    ? isVi
                      ? 'Đang chờ xác thực / tiếp nhận'
                      : 'Awaiting your verification step'
                    : isVi
                    ? 'Không có bước chờ xử lý'
                    : 'All caught up'}
                </span>
              </div>
            </article>

            <article className="card beneficiary-kpi-card">
              <span className="beneficiary-kpi-card__icon" aria-hidden="true">
                <Layers size={20} />
              </span>
              <div className="beneficiary-kpi-card__body">
                <span className="beneficiary-kpi-card__label">
                  {isVi ? 'Tài sản được thừa kế' : 'Inherited Assets'}
                </span>
                <strong className="beneficiary-kpi-card__value">{totalAssetsCount}</strong>
                <span className="beneficiary-kpi-card__hint">
                  {isVi
                    ? 'Tài sản được phân quyền cho bạn'
                    : 'Authorized items across your cases'}
                </span>
              </div>
            </article>
          </section>

          <section aria-label={t.beneficiary.title}>
            <div className="beneficiary-section-bar">
              <h2>
                <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                {isVi ? 'Danh sách hồ sơ bàn giao' : 'Handover Cases'}
              </h2>
              <span className="beneficiary-count-pill">
                {totalCases} {isVi ? 'hồ sơ' : totalCases === 1 ? 'case' : 'cases'}
              </span>
            </div>

            {cases.length === 0 ? (
              <EmptyState
                icon="inbox"
                title={t.beneficiary.emptyTitle}
                text={t.beneficiary.emptyText}
              />
            ) : (
              <div className="beneficiary-case-list">
                {cases.map((handover) => {
                  const assets = handover.assets || []
                  const previewAssets = assets.slice(0, 4)
                  const remainingAssets = Math.max(0, assets.length - previewAssets.length)
                  const isCompleted = handover.status === HANDOVER_STATUS.COMPLETED
                  const isRejected = handover.status === HANDOVER_STATUS.REJECTED
                  const doneCount = getMilestoneDoneCount(handover.status)
                  const cardToneClass = isRejected
                    ? 'beneficiary-case-card--danger'
                    : !isCompleted
                    ? 'beneficiary-case-card--pending'
                    : ''
                  const nextActionText =
                    t.beneficiary.nextAction[handover.status] ||
                    (isVi ? 'Xem chi tiết hồ sơ' : 'Open case details')

                  return (
                    <article
                      key={handover.id}
                      className={`card beneficiary-case-card ${cardToneClass}`.trim()}
                    >
                      <header className="beneficiary-case-card__head">
                        <div className="beneficiary-case-card__identity">
                          <span className="beneficiary-case-card__badge-icon" aria-hidden="true">
                            {isCompleted ? <CheckCircle2 size={20} /> : <FolderOpen size={20} />}
                          </span>
                          <div>
                            <span className="handover-card__id">{t.caseId}</span>
                            <h3 className="beneficiary-case-card__title">{handover.id}</h3>
                          </div>
                        </div>
                        <HandoverStatusBadge status={handover.status} />
                      </header>

                      {doneCount !== null && (
                        <ol
                          className="beneficiary-stepper"
                          aria-label={isVi ? 'Tiến trình bàn giao' : 'Handover progress'}
                        >
                          {stepLabels.map((label, idx) => {
                            const stepDone = idx < doneCount
                            const stepCurrent = !isCompleted && idx === doneCount
                            const stateClass = stepDone
                              ? 'is-done'
                              : stepCurrent
                              ? 'is-current'
                              : ''
                            return (
                              <li
                                key={label}
                                className={`beneficiary-stepper__step ${stateClass}`.trim()}
                              >
                                <span className="beneficiary-stepper__dot" aria-hidden="true">
                                  {stepDone ? <Check size={12} strokeWidth={2.6} /> : idx + 1}
                                </span>
                                <span>{label}</span>
                              </li>
                            )
                          })}
                        </ol>
                      )}

                      <div className="beneficiary-case-bento">
                        <div className="beneficiary-meta-box">
                          <span className="beneficiary-meta-box__label">
                            <ShieldCheck size={13} aria-hidden="true" />
                            {t.vault}
                          </span>
                          <span className="beneficiary-meta-box__value">
                            {handover.vault?.name || '—'}
                          </span>
                          <span className="beneficiary-meta-box__sub">
                            {t.owner}: {handover.vault?.ownerName || handover.vault?.owner?.name || '—'}
                          </span>
                        </div>

                        <div className="beneficiary-meta-box">
                          <span className="beneficiary-meta-box__label">
                            <Layers size={13} aria-hidden="true" />
                            {t.assets} ({assets.length})
                          </span>
                          {assets.length > 0 ? (
                            <ul className="beneficiary-asset-chips">
                              {previewAssets.map((asset, idx) => (
                                <li
                                  key={asset.id || `${handover.id}-asset-${idx}`}
                                  className="beneficiary-asset-chip"
                                >
                                  <AssetCategoryIcon category={asset.category} />
                                  <span>{asset.name}</span>
                                </li>
                              ))}
                              {remainingAssets > 0 && (
                                <li className="beneficiary-asset-chip beneficiary-asset-chip--more">
                                  +{remainingAssets}{' '}
                                  {isVi ? 'tài sản khác' : 'more'}
                                </li>
                              )}
                            </ul>
                          ) : (
                            <span className="beneficiary-meta-box__sub">
                              {isVi
                                ? 'Chưa có thông tin tài sản đính kèm'
                                : 'No asset items listed yet'}
                            </span>
                          )}
                        </div>
                      </div>

                      <footer className="beneficiary-case-footer">
                        <span
                          className={`beneficiary-next-pill ${
                            isCompleted
                              ? 'beneficiary-next-pill--done'
                              : isRejected
                              ? 'beneficiary-next-pill--danger'
                              : ''
                          }`.trim()}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={14} aria-hidden="true" />
                          ) : (
                            <Icon name="arrowRight" size={14} />
                          )}
                          {nextActionText}
                        </span>
                        <Button onClick={() => handleOpenCase(handover)} icon="arrowRight">
                          {t.beneficiary.open}
                        </Button>
                      </footer>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Handover Access Code & Email Verification Modal */}
      {selectedCaseForClaim && (
        <div
          className="flow-modal-overlay"
          onClick={() => !claimLoading && setSelectedCaseForClaim(null)}
          role="presentation"
        >
          <div
            className="flow-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="claim-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="beneficiary-claim-head">
              <div className="beneficiary-claim-title-wrap">
                <span className="beneficiary-claim-icon" aria-hidden="true">
                  <KeyRound size={20} />
                </span>
                <div>
                  <span
                    className="badge"
                    style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'inline-flex' }}
                  >
                    {t.caseId}: {selectedCaseForClaim.id}
                  </span>
                  <h2
                    id="claim-modal-title"
                    style={{ margin: '2px 0 0', fontSize: '1.25rem', color: 'var(--color-heading)' }}
                  >
                    {isVi ? 'Xác thực quyền nhận di sản' : 'Claim Handover Access'}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                    {selectedCaseForClaim.vault?.name} ({t.owner}:{' '}
                    {selectedCaseForClaim.vault?.ownerName ||
                      selectedCaseForClaim.vault?.owner?.name ||
                      '—'}
                    )
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="beneficiary-claim-close"
                onClick={() => setSelectedCaseForClaim(null)}
                disabled={claimLoading}
                aria-label={isVi ? 'Đóng hộp thoại' : 'Close dialog'}
              >
                <X size={18} />
              </button>
            </div>

            {claimSuccess && <FormAlert tone="success">{claimSuccess}</FormAlert>}
            {claimError && <FormAlert>{claimError}</FormAlert>}

            <form
              onSubmit={handleClaimSubmit}
              className="form-stack"
              noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <FormField
                id="claim-email"
                label={isVi ? 'Email Người thụ hưởng' : 'Beneficiary Email'}
                type="email"
                value={claimEmail}
                onChange={(e) => setClaimEmail(e.target.value)}
                placeholder="beneficiary@legacyvault.demo"
                autoComplete="email"
                disabled={claimLoading}
                required
              />

              <FormField
                id="claim-access-code"
                label={isVi ? 'Mã truy cập bàn giao' : 'Handover Access Code'}
                value={claimAccessCode}
                onChange={(e) => setClaimAccessCode(e.target.value)}
                placeholder="HC-20261022-XXXX-HANDOVER-SECURE"
                hint={
                  isVi
                    ? 'Mã truy cập do Người thực thi (Executor) cung cấp.'
                    : 'Access code provided by the case executor.'
                }
                disabled={claimLoading}
                required
              />

              <div style={{ marginTop: '10px' }}>
                <Button
                  type="submit"
                  disabled={claimLoading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {claimLoading
                    ? isVi
                      ? 'Đang gửi mã OTP...'
                      : 'Sending OTP...'
                    : isVi
                    ? 'Xác thực mã & Nhận OTP'
                    : 'Verify Code & Send OTP'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HandoverLayout>
  )
}
