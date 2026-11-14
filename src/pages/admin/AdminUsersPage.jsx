import { useState } from 'react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import { AdminLayout } from '../../components/admin/AdminParts.jsx'
import { ConfirmDialog } from '../../components/handover/HandoverParts.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ROLES } from '../../auth/roles.js'
import { USER_STATUS } from '../../admin/adminDefaults.js'
import { dashboardContent } from '../../data/dashboardContent.js'
import { flow7Content, flow7ErrorText } from '../../data/flow7Content.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { listUsers, setUserRole, setUserStatus } from '../../services/adminService.js'

const EMPTY_FILTERS = { search: '', role: 'ALL', status: 'ALL' }
const ADMIN_ASSIGNABLE_ROLES = [ROLES.ADMIN, ROLES.LEGAL_VERIFIER, ROLES.VAULT_OWNER]

// Manage user accounts, access status and role assignments.
export default function AdminUsersPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = flow7Content[language]
  const u = t.admin.users
  const roleLabels = dashboardContent[language].roles
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const { status, data: users, error, reload } = useAsync(() => listUsers(user), user.id)
  const [pending, setPending] = useState(null) // { kind: 'status' | 'role', target, value }
  const [roleDraft, setRoleDraft] = useState({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))
  const queryText = filters.search.trim().toLowerCase()
  const filteredUsers = (users ?? []).filter((item) => {
    if (filters.role !== 'ALL' && item.role !== filters.role) return false
    if (filters.status !== 'ALL' && item.status !== filters.status) return false
    if (
      queryText &&
      !String(item.fullName || '').toLowerCase().includes(queryText) &&
      !String(item.identifier || '').toLowerCase().includes(queryText)
    ) {
      return false
    }
    return true
  })

  const apply = async () => {
    setBusy(true)
    setMessage(null)
    try {
      if (pending.kind === 'status') await setUserStatus(user, pending.target.id, pending.value)
      else await setUserRole(user, pending.target.id, pending.value)
      setMessage({ tone: 'success', text: u.changed })
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
          <h1 className="page-title">{u.title}</h1>
          <p className="page-text">{u.text}</p>
        </div>
      </div>

      {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}
      {status === 'loading' && <LoadingState label={t.loading} />}
      {status === 'error' && <ErrorState message={flow7ErrorText(t, error)} retryLabel={t.retry} onRetry={reload} />}
      {status === 'ready' && (
        <>
          <form className="card admin-filters" onSubmit={(e) => e.preventDefault()} aria-label="User filters">
            <label className="admin-filter">
              <span>{u.search}</span>
              <input className="field__input" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
            </label>
            <label className="admin-filter">
              <span>{u.filterRole}</span>
              <select className="field__input" value={filters.role} onChange={(e) => setFilter('role', e.target.value)}>
                <option value="ALL">{u.all}</option>
                {Object.values(ROLES).map((role) => (
                  <option key={role} value={role}>{roleLabels[role]?.label ?? role}</option>
                ))}
              </select>
            </label>
            <label className="admin-filter">
              <span>{u.filterStatus}</span>
              <select className="field__input" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
                <option value="ALL">{u.all}</option>
                {Object.keys(u.statuses).map((st) => (
                  <option key={st} value={st}>{u.statuses[st]}</option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-link btn-sm" onClick={() => setFilters(EMPTY_FILTERS)}>{u.clear}</button>
          </form>

          {filteredUsers.length === 0 ? (
            <EmptyState icon="users" title={u.empty} text="" />
          ) : (
            <div className="admin-table-wrap card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">{u.name}</th>
                    <th scope="col">{u.account}</th>
                    <th scope="col">{u.role}</th>
                    <th scope="col">{u.status}</th>
                    <th scope="col">{u.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => {
                    const self = item.id === user.id
                    const roleCanBeChanged = ADMIN_ASSIGNABLE_ROLES.includes(item.role)
                    const draft = roleDraft[item.id] ?? item.role
                    const nextStatus = item.status === USER_STATUS.ACTIVE ? USER_STATUS.SUSPENDED : USER_STATUS.ACTIVE
                    return (
                      <tr key={item.id}>
                        <td>
                          {item.fullName}
                          {self && <small className="admin-muted">({u.you})</small>}
                        </td>
                        <td className="admin-table__details">{item.identifier}</td>
                        <td>
                          {roleCanBeChanged ? (
                            <>
                              <label className="visually-hidden" htmlFor={`role-${item.id}`}>{u.role}</label>
                              <select
                                id={`role-${item.id}`}
                                className="field__input admin-select"
                                value={draft}
                                disabled={self}
                                onChange={(e) => setRoleDraft((prev) => ({ ...prev, [item.id]: e.target.value }))}
                              >
                                {ADMIN_ASSIGNABLE_ROLES.map((role) => (
                                  <option key={role} value={role}>{roleLabels[role].label}</option>
                                ))}
                              </select>
                            </>
                          ) : (
                            <span className="admin-muted" title={language === 'vi'
                              ? 'Vai trò này được xác định theo liên kết vault hoặc hồ sơ bàn giao.'
                              : 'This role is determined by vault or handover-case relationships.'}
                            >
                              {roleLabels[item.role]?.label ?? item.role}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`handover-status handover-status--${item.status === USER_STATUS.ACTIVE ? 'success' : 'danger'}`}>
                            <span className="handover-status__dot" aria-hidden="true" />
                            {u.statuses[item.status] ?? item.status}
                          </span>
                        </td>
                        <td className="admin-actions">
                          {roleCanBeChanged && (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={self || draft === item.role}
                              onClick={() => setPending({ kind: 'role', target: item, value: draft })}
                            >
                              {u.changeRole}
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={self}
                            onClick={() => setPending({ kind: 'status', target: item, value: nextStatus })}
                          >
                            {item.status === USER_STATUS.ACTIVE ? u.suspend : u.activate}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {pending && (
        <ConfirmDialog
          title={pending.kind === 'status'
            ? u.confirmStatus(pending.target.fullName, u.statuses[pending.value])
            : u.confirmRole(pending.target.fullName, roleLabels[pending.value].label)}
          busy={busy}
          onClose={() => setPending(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setPending(null)} disabled={busy}>{t.cancel}</Button>
              <Button onClick={apply} disabled={busy}>{busy ? t.saving : t.confirm}</Button>
            </>
          }
        >
          <p className="page-text">{u.confirmText}</p>
        </ConfirmDialog>
      )}
    </AdminLayout>
  )
}
