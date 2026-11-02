import { useState } from 'react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import { AdminLayout, AuditTable } from '../../components/admin/AdminParts.jsx'
import { adminPaths } from '../../admin/adminPaths.js'
import { ConfirmDialog } from '../../components/handover/HandoverParts.jsx'
import { ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { isSecurityAlert } from '../../audit/auditRules.js'
import { flow7Content, flow7ErrorText } from '../../data/flow7Content.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import {
  approveAccessRequestApi,
  getAdminDashboardApi,
  IS_DEMO_MODE,
  listUsers,
  rejectAccessRequestApi,
  resetAllDemoData,
} from '../../services/adminService.js'
import { listAuditLog } from '../../services/auditService.js'

const RECENT_ALERTS = 5

// Flow 7 — Admin dashboard: totals, recent security alerts, demo reset.
export default function AdminOverviewPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = flow7Content[language]
  const o = t.admin.overview
  const { status, data, error, reload } = useAsync(
    () => Promise.all([getAdminDashboardApi(), listUsers(user), listAuditLog(user)]),
    user.id,
  )
  const [confirming, setConfirming] = useState(false)
  const [pendingAccess, setPendingAccess] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const reset = async () => {
    setBusy(true)
    try {
      await resetAllDemoData(user)
      setMessage({ tone: 'success', text: o.resetDone })
      reload()
    } catch (err) {
      setMessage({ tone: 'error', text: flow7ErrorText(t, err) })
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  const decideAccessRequest = async () => {
    if (!pendingAccess) return
    setBusy(true)
    setMessage(null)
    try {
      if (pendingAccess.decision === 'approve') {
        await approveAccessRequestApi(pendingAccess.request.request_id)
        setMessage({ tone: 'success', text: o.requestApproved })
      } else {
        await rejectAccessRequestApi(pendingAccess.request.request_id)
        setMessage({ tone: 'success', text: o.requestRejected })
      }
      reload()
    } catch (err) {
      setMessage({ tone: 'error', text: flow7ErrorText(t, err) })
    } finally {
      setBusy(false)
      setPendingAccess(null)
    }
  }

  const [dashboard, users, entries] = data ?? [null, [], []]
  const alerts = entries.filter(isSecurityAlert)
  const requests = dashboard?.access_requests || []
  const stats = [
    [o.users, dashboard?.metrics?.total_users ?? users.length],
    [o.pendingRequests, dashboard?.metrics?.pending_requests ?? requests.length],
    [o.suspended, users.filter((item) => item.status === 'SUSPENDED').length],
    [o.alerts, alerts.length],
    [o.events, dashboard?.metrics?.audit_events ?? entries.length],
  ]

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <span className="badge badge--accent">{t.admin.badge}</span>
          <h1 className="page-title">{o.title}</h1>
          <p className="page-text">{o.text}</p>
        </div>
        {IS_DEMO_MODE && (
          <div className="page-head__actions">
            <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>{o.reset}</Button>
          </div>
        )}
      </div>

      {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}
      {status === 'loading' && <LoadingState label={t.loading} />}
      {status === 'error' && <ErrorState message={flow7ErrorText(t, error)} retryLabel={t.retry} onRetry={reload} />}
      {status === 'ready' && (
        <>
          <dl className="stat-grid handover-stats">
            {stats.map(([label, value]) => (
              <div key={label} className="card stat-card">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <section className="card handover-panel">
            <div className="handover-card__head">
              <h2 className="section-title">{o.recentAlerts}</h2>
              <Button variant="secondary" size="sm" to={`${adminPaths.audit}?alerts=1`}>{o.viewAll}</Button>
            </div>
            {alerts.length ? <AuditTable entries={alerts.slice(0, RECENT_ALERTS)} /> : <p className="page-text">{o.noAlerts}</p>}
          </section>
          <section className="card handover-panel admin-access-queue">
            <div className="handover-card__head">
              <h2 className="section-title">{o.requestsTitle}</h2>
              <span className="badge">{requests.length}</span>
            </div>
            {requests.length === 0 ? <p className="page-text">{o.noRequests}</p> : (
              <ul className="admin-access-queue__list">
                {requests.map((request) => (
                  <li key={request.request_id} className="admin-access-queue__item">
                    <div className="admin-access-queue__details">
                      <strong>{request.user_name}</strong>
                      <span>{request.requested_role}</span>
                      <small>{o.requestId}: {request.request_id}</small>
                    </div>
                    {!IS_DEMO_MODE && (
                      <div className="admin-actions">
                        <Button variant="secondary" size="sm" onClick={() => setPendingAccess({ request, decision: 'reject' })}>
                          {o.reject}
                        </Button>
                        <Button size="sm" onClick={() => setPendingAccess({ request, decision: 'approve' })}>
                          {o.approve}
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {pendingAccess && (
        <ConfirmDialog
          title={pendingAccess.decision === 'approve'
            ? o.confirmApprove(pendingAccess.request.user_name)
            : o.confirmReject(pendingAccess.request.user_name)}
          busy={busy}
          onClose={() => setPendingAccess(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setPendingAccess(null)} disabled={busy}>{t.cancel}</Button>
              <Button onClick={decideAccessRequest} disabled={busy}>{busy ? t.saving : t.confirm}</Button>
            </>
          }
        >
          <p className="page-text">{pendingAccess.request.requested_role}</p>
        </ConfirmDialog>
      )}

      {confirming && (
        <ConfirmDialog
          title={o.resetTitle}
          busy={busy}
          onClose={() => setConfirming(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>{t.cancel}</Button>
              <Button onClick={reset} disabled={busy}>{busy ? t.saving : t.confirm}</Button>
            </>
          }
        >
          <p className="page-text">{o.resetText}</p>
        </ConfirmDialog>
      )}
    </AdminLayout>
  )
}
