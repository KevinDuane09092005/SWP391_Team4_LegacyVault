import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../../components/Icon.jsx'
import { AdminLayout, AuditTable } from '../../components/admin/AdminParts.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { AUDIT_ACTIONS, OUTCOME } from '../../audit/auditRules.js'
import { flow7Content, flow7ErrorText } from '../../data/flow7Content.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { listAuditLog } from '../../services/auditService.js'

const EMPTY = { actor: '', action: '', outcome: '', from: '', to: '', alertsOnly: false }

// Flow 7 — Audit log and security alerts (admin only), with filters.
export default function AdminAuditPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = flow7Content[language]
  const a = t.audit
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({ ...EMPTY, alertsOnly: searchParams.get('alerts') === '1' })
  const { status, data, error, reload } = useAsync(() => listAuditLog(user, filters), `${user.id}:${JSON.stringify(filters)}`)
  const set = (name, value) => setFilters((prev) => ({ ...prev, [name]: value }))

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.admin.auditPage.title}</h1>
          <p className="page-text">{t.admin.auditPage.text}</p>
        </div>
      </div>
      <p className="handover-note handover-note--danger admin-warning">
        <Icon name="alertCircle" size={15} /> {t.admin.auditPage.warning}
      </p>

      <form className="card admin-filters" onSubmit={(e) => e.preventDefault()} aria-label="Audit filters">
        <label className="admin-filter">
          <span>{a.filters.search}</span>
          <input className="field__input" value={filters.actor} onChange={(e) => set('actor', e.target.value)} />
        </label>
        <label className="admin-filter">
          <span>{a.filters.action}</span>
          <select className="field__input" value={filters.action} onChange={(e) => set('action', e.target.value)}>
            <option value="">{a.filters.any}</option>
            {Object.values(AUDIT_ACTIONS).map((action) => <option key={action} value={action}>{a.actions[action]}</option>)}
          </select>
        </label>
        <label className="admin-filter">
          <span>{a.filters.outcome}</span>
          <select className="field__input" value={filters.outcome} onChange={(e) => set('outcome', e.target.value)}>
            <option value="">{a.filters.any}</option>
            {Object.values(OUTCOME).map((outcome) => <option key={outcome} value={outcome}>{a.outcomes[outcome]}</option>)}
          </select>
        </label>
        <label className="admin-filter">
          <span>{a.filters.from}</span>
          <input type="date" className="field__input" value={filters.from} onChange={(e) => set('from', e.target.value)} />
        </label>
        <label className="admin-filter">
          <span>{a.filters.to}</span>
          <input type="date" className="field__input" value={filters.to} onChange={(e) => set('to', e.target.value)} />
        </label>
        <label className="handover-check admin-filter--check">
          <input type="checkbox" checked={filters.alertsOnly} onChange={(e) => set('alertsOnly', e.target.checked)} />
          <span>{a.filters.alertsOnly}</span>
        </label>
        <button type="button" className="btn btn-link btn-sm" onClick={() => setFilters(EMPTY)}>{a.filters.clear}</button>
      </form>

      {status === 'loading' && <LoadingState label={t.loading} />}
      {status === 'error' && <ErrorState message={flow7ErrorText(t, error)} retryLabel={t.retry} onRetry={reload} />}
      {status === 'ready' && (data.length === 0
        ? <EmptyState icon="inbox" title={a.empty} text="" />
        : (
          <>
            <p className="admin-muted admin-count">{a.count(data.length)}</p>
            <AuditTable entries={data} />
          </>
        ))}
    </AdminLayout>
  )
}
