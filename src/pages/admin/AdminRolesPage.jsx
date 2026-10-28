import Icon from '../../components/Icon.jsx'
import { AdminLayout } from '../../components/admin/AdminParts.jsx'
import { ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { flow7Content, flow7ErrorText } from '../../data/flow7Content.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getAdminDashboard } from '../../services/adminService.js'

export default function AdminRolesPage() {
  const { language } = useLanguage()
  const t = flow7Content[language]
  const r = t.admin.roles
  const { status, data, error, reload } = useAsync(getAdminDashboard, 'admin-role-summary')
  const roleSummary = data?.roles_and_permissions_summary ?? []

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1 className="page-title">{r.title}</h1>
          <p className="page-text">{r.text}</p>
        </div>
      </div>

      <p className="handover-note">
        <Icon name="info" size={15} /> {t.admin.rolesReadOnly}
      </p>

      {status === 'loading' && <LoadingState label={t.loading} />}
      {status === 'error' && <ErrorState message={flow7ErrorText(t, error)} retryLabel={t.retry} onRetry={reload} />}
      {status === 'ready' && (
        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">{r.role}</th>
                <th scope="col">{r.description}</th>
                <th scope="col">{r.userCount}</th>
              </tr>
            </thead>
            <tbody>
              {roleSummary.map((role) => (
                <tr key={role.role_name}>
                  <th scope="row">{role.role_name}</th>
                  <td>{role.description}</td>
                  <td>{role.user_count}</td>
                </tr>
              ))}
              {roleSummary.length === 0 && (
                <tr>
                  <td colSpan="3" className="admin-table__details">{t.admin.backendUnavailable}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
