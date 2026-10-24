import Button from '../../components/Button.jsx'
import Icon from '../../components/Icon.jsx'
import { HandoverLayout, HandoverStatusBadge } from '../../components/handover/HandoverParts.jsx'
import { NotificationList } from '../../components/notifications/NotificationParts.jsx'
import useMyNotifications from '../../hooks/useMyNotifications.js'
import { EmptyState, ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { handoverContent, handoverErrorText } from '../../data/handoverContent.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { listBeneficiaryCases } from '../../services/handoverService.js'
import { markNotificationRead } from '../../services/notificationService.js'

// Flow 6 — Beneficiary dashboard: handover notifications (Flow 7 Notification Service, demo)
// and the handovers assigned to the signed-in beneficiary. Only their own cases are returned.
export default function BeneficiaryHandoversPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = handoverContent[language]
  const { status, data: cases, error, reload } = useAsync(() => listBeneficiaryCases(user), user.id)
  const { items } = useMyNotifications()
  const caseNotifications = items.filter((item) => item.caseId)

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
                      <Button to={`/dashboard/beneficiary/handover/${handover.id}`}>{t.beneficiary.open}</Button>
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </HandoverLayout>
  )
}
