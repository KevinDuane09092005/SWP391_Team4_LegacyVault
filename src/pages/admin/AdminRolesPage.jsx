import { useState } from 'react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import { AdminLayout, PrototypeOnlyNotice } from '../../components/admin/AdminParts.jsx'
import { ConfirmDialog } from '../../components/handover/HandoverParts.jsx'
import { ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ROLES } from '../../auth/roles.js'
import { dashboardContent } from '../../data/dashboardContent.js'
import { flow7Content, flow7ErrorText } from '../../data/flow7Content.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { IS_DEMO_MODE } from '../../services/adminService.js'
import { getPermissions, setPermission } from '../../services/adminService.js'

// Flow 7 — Role / permission matrix (demo record; real guards are unchanged).
export default function AdminRolesPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = flow7Content[language]
  const r = t.admin.roles
  const roleLabels = dashboardContent[language].roles
  const { status, data, error, reload } = useAsync(() => getPermissions(user), user.id)
  const [pending, setPending] = useState(null) // { role, permission, granted }
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const roles = Object.values(ROLES)

  const apply = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await setPermission(user, pending.role, pending.permission, pending.granted)
      setMessage({ tone: 'success', text: t.saved })
      reload()
    } catch (err) {
      setMessage({ tone: 'error', text: flow7ErrorText(t, err) })
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1 className="page-title">{r.title}</h1>
          <p className="page-text">{r.text}</p>
        </div>
      </div>

      <PrototypeOnlyNotice />

      {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}
      {status === 'loading' && <LoadingState label={t.loading} />}
      {status === 'error' && <ErrorState message={flow7ErrorText(t, error)} retryLabel={t.retry} onRetry={reload} />}
      {status === 'ready' && (
        <div className="admin-table-wrap card">
          <table className="admin-table admin-matrix">
            <thead>
              <tr>
                <th scope="col">{r.permission}</th>
                {roles.map((role) => <th key={role} scope="col">{roleLabels[role].label}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.permissions.map((permission) => (
                <tr key={permission}>
                  <th scope="row">
                    {r.labels[permission] ?? permission}
                    <small className="admin-muted"><code>{permission}</code></small>
                  </th>
                  {roles.map((role) => {
                    const granted = data.matrix[role]?.includes(permission) ?? false
                    const locked = granted && data.locked[role]?.includes(permission)
                    return (
                      <td key={role} className="admin-matrix__cell">
                        <input
                          type="checkbox"
                          checked={granted}
                          disabled={locked || busy || !IS_DEMO_MODE}
                          title={locked ? r.locked : undefined}
                          aria-label={`${roleLabels[role].label}: ${r.labels[permission] ?? permission}`}
                          onChange={() => setPending({ role, permission, granted: !granted })}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pending && (
        <ConfirmDialog
          title={r.confirm(pending.granted, r.labels[pending.permission] ?? pending.permission, roleLabels[pending.role].label)}
          busy={busy}
          onClose={() => setPending(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setPending(null)} disabled={busy}>{t.cancel}</Button>
              <Button onClick={apply} disabled={busy}>{busy ? t.saving : t.confirm}</Button>
            </>
          }
        >
          <p className="page-text">{r.confirmText}</p>
        </ConfirmDialog>
      )}
    </AdminLayout>
  )
}
