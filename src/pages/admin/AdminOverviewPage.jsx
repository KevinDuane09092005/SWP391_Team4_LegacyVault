import { useState } from 'react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import { AdminLayout, AuditTable } from '../../components/admin/AdminParts.jsx'
import { adminPaths } from '../../admin/adminPaths.js'
import { ConfirmDialog } from '../../components/handover/HandoverParts.jsx'
import { ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { flow7Content, flow7ErrorText } from '../../data/flow7Content.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import {
  approveAccessRequest,
  getAdminDashboard,
  getAdminUsersPage,
  listAuditLog,
  rejectAccessRequest,
} from '../../services/adminService.js'

const RECENT_ALERTS = 5

export default function AdminOverviewPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = flow7Content[language]
  const o = t.admin.overview
  const [pendingDecision, setPendingDecision] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const loadOverview = async () => {
    const [dashboard, suspendedUsers, alerts] = await Promise.all([
      getAdminDashboard(),
      getAdminUsersPage({ status: 'SUSPENDED', page: 0, size: 1 }),
      listAuditLog(user, { alertsOnly: true, page: 0, size: 100 }),
    ])
    return {
      dashboard,
      suspendedCount: suspendedUsers.pagination?.totalElements ?? suspendedUsers.users.length,
      alerts,
    }
  }

  const { status, data, error, reload } = useAsync(loadOverview, user.id)
  const metrics = data?.dashboard?.kpi_metrics ?? {}
  const requests = data?.dashboard?.access_requests_queue ?? []
  const stats = [
    [o.users, metrics.total_users ?? 0],
    [o.suspended, data?.suspendedCount ?? 0],
    [o.alerts, data?.alerts?.length ?? 0],
    [o.events, metrics.audit_events ?? 0],
  ]

  const decideRequest = async () => {
    if (!pendingDecision) return
    setBusy(true)
    setMessage(null)
    try {
      const { request, decision } = pendingDecision
      if (decision === 'approve') await approveAccessRequest(request.request_id)
      else await rejectAccessRequest(request.request_id)
      setMessage({ tone: 'success', text: o.requestReviewed })
      reload()
    } catch (err) {
      setMessage({ tone: 'error', text: flow7ErrorText(t, err) })
    } finally {
      setBusy(false)
      setPendingDecision(null)
    }
  }

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <span className="badge badge--accent">{t.admin.badge}</span>
          <h1 className="page-title">{o.title}</h1>
          <p className="page-text">{o.text}</p>
        </div>
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
            {data.alerts.length
              ? <AuditTable entries={data.alerts.slice(0, RECENT_ALERTS)} />
              : <p className="page-text">{o.noAlerts}</p>}
          </section>

          <section className="card handover-panel">
            <div className="handover-card__head">
              <h2 className="section-title">{o.requests}</h2>
            </div>
            {requests.length === 0 ? (
              <p className="page-text">{o.noRequests}</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">{o.requester}</th>
                      <th scope="col">{o.request}</th>
                      <th scope="col">{o.requestActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.request_id}>
                        <td>{request.requester_name}</td>
                        <td className="admin-table__details">{request.requested_role_or_purpose}</td>
                        <td className="admin-actions">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busy}
                            onClick={() => setPendingDecision({ request, decision: 'approve' })}
                          >
                            {o.approve}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busy}
                            onClick={() => setPendingDecision({ request, decision: 'reject' })}
                          >
                            {o.reject}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {pendingDecision && (
        <ConfirmDialog
          title={o.confirmRequest(
            pendingDecision.decision === 'approve' ? o.approve : o.reject,
            pendingDecision.request.requester_name,
          )}
          busy={busy}
          onClose={() => setPendingDecision(null)}
          actions={(
            <>
              <Button variant="secondary" onClick={() => setPendingDecision(null)} disabled={busy}>{t.cancel}</Button>
              <Button onClick={decideRequest} disabled={busy}>{busy ? t.saving : t.confirm}</Button>
            </>
          )}
        >
          <p className="page-text">{pendingDecision.request.requested_role_or_purpose}</p>
        </ConfirmDialog>
      )}
    </AdminLayout>
  )
}
