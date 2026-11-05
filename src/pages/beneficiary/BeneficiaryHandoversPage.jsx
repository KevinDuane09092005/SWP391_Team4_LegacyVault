import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Icon from '../../components/Icon.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import FormField from '../../components/auth/FormField.jsx'
import { HandoverLayout, HandoverStatusBadge } from '../../components/handover/HandoverParts.jsx'
import { NotificationList } from '../../components/notifications/NotificationParts.jsx'
import useMyNotifications from '../../hooks/useMyNotifications.js'
import { EmptyState, ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { handoverContent, handoverErrorText } from '../../data/handoverContent.js'
import { HANDOVER_STATUS, hasReached } from '../../handover/handoverStatus.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { listBeneficiaryCases, requestHandoverOtpApi } from '../../services/handoverService.js'
import { markNotificationRead } from '../../services/notificationService.js'

// Flow 6 — Beneficiary dashboard: handover notifications (Flow 7 Notification Service, demo)
// and the handovers assigned to the signed-in beneficiary. Only their own cases are returned.
export default function BeneficiaryHandoversPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const t = handoverContent[language]
  const { status, data: cases, error, reload } = useAsync(() => listBeneficiaryCases(user), user?.id)
  const { items } = useMyNotifications()
  const caseNotifications = items.filter((item) => item.caseId)

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
        language === 'vi'
          ? 'Vui lòng nhập đầy đủ Email và Mã truy cập bàn giao.'
          : 'Please enter Email and Handover Access Code.'
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
        language === 'vi'
          ? 'Mã xác thực OTP đã được gửi đến email của bạn!'
          : 'Verification OTP has been sent to your email!'
      )
      setTimeout(() => {
        const targetId = selectedCaseForClaim.id
        setSelectedCaseForClaim(null)
        navigate(`/dashboard/beneficiary/handover/${targetId}`)
      }, 1000)
    } catch (err) {
      setClaimError(
        err.message ||
        (language === 'vi' ? 'Mã truy cập hoặc email không hợp lệ.' : 'Invalid email or access code.')
      )
    } finally {
      setClaimLoading(false)
    }
  }

  return (
    <HandoverLayout>
      <div className="page-head">
        <div>
          <span className="badge badge--accent">{t.beneficiary.title}</span>
          <h1 className="page-title">{t.beneficiary.title}</h1>
          <p className="page-text">{t.beneficiary.text}</p>
        </div>
      </div>

      {status === 'loading' && <LoadingState label={t.loading} />}
      {status === 'error' && <ErrorState message={handoverErrorText(t, error)} retryLabel={t.retry} onRetry={reload} />}

      {status === 'ready' && (
        <div className="handover-columns">
          <section className="card handover-panel" aria-labelledby="ntf-title">
            <h2 id="ntf-title" className="section-title">
              <Icon name="mail" size={17} /> {t.beneficiary.notifications}
            </h2>
            {caseNotifications.length === 0 ? (
              <p className="page-text">{t.beneficiary.noNotifications}</p>
            ) : (
              <NotificationList items={caseNotifications} onMarkRead={(id) => markNotificationRead(user, id)} />
            )}
            <Button variant="secondary" size="sm" to="/dashboard/notifications">{t.beneficiary.allNotifications}</Button>
          </section>

          <section aria-label={t.beneficiary.title}>
            {cases.length === 0 ? (
              <EmptyState icon="inbox" title={t.beneficiary.emptyTitle} text={t.beneficiary.emptyText} />
            ) : (
              <div className="handover-list">
                {cases.map((handover) => (
                  <article key={handover.id} className="card handover-card">
                    <header className="handover-card__head">
                      <div>
                        <span className="handover-card__id">{t.caseId}</span>
                        <h2 className="section-title">{handover.id}</h2>
                      </div>
                      <HandoverStatusBadge status={handover.status} />
                    </header>
                    <dl className="handover-facts">
                      <div>
                        <dt>{t.vault}</dt>
                        <dd>
                          {handover.vault?.name || '—'}
                          <small>{t.owner}: {handover.vault?.ownerName || handover.vault?.owner?.name || '—'}</small>
                        </dd>
                      </div>
                      <div>
                        <dt>{t.assets}</dt>
                        <dd>{handover.assets?.length ?? 0}</dd>
                      </div>
                    </dl>
                    <footer className="handover-card__actions">
                      <p className="handover-note">
                        <Icon name="arrowRight" size={14} /> {t.beneficiary.nextAction[handover.status]}
                      </p>
                      <Button onClick={() => handleOpenCase(handover)}>{t.beneficiary.open}</Button>
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="badge badge--accent" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'inline-block' }}>
                  {t.caseId}: {selectedCaseForClaim.id}
                </span>
                <h2 id="claim-modal-title" style={{ margin: '4px 0 0', fontSize: '1.25rem', color: 'var(--color-heading)' }}>
                  {language === 'vi' ? 'Xác thực quyền nhận di sản' : 'Claim Handover Access'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  {selectedCaseForClaim.vault?.name} ({t.owner}: {selectedCaseForClaim.vault?.ownerName || selectedCaseForClaim.vault?.owner?.name || '—'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseForClaim(null)}
                disabled={claimLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '1.25rem',
                  lineHeight: 1,
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {claimSuccess && <FormAlert tone="success">{claimSuccess}</FormAlert>}
            {claimError && <FormAlert>{claimError}</FormAlert>}

            <form onSubmit={handleClaimSubmit} className="form-stack" noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <FormField
                id="claim-email"
                label={language === 'vi' ? 'Email Người thụ hưởng' : 'Beneficiary Email'}
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
                label={language === 'vi' ? 'Mã truy cập bàn giao' : 'Handover Access Code'}
                value={claimAccessCode}
                onChange={(e) => setClaimAccessCode(e.target.value)}
                placeholder="HC-20261022-XXXX-HANDOVER-SECURE"
                hint={
                  language === 'vi'
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
                    ? (language === 'vi' ? 'Đang gửi mã OTP...' : 'Sending OTP...')
                    : (language === 'vi' ? 'Xác thực mã & Nhận OTP' : 'Verify Code & Send OTP')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HandoverLayout>
  )
}
