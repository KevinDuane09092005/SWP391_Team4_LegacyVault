import { NavLink } from 'react-router-dom'
import DashboardLayout from '../dashboard/DashboardLayout.jsx'
import Icon from '../Icon.jsx'
import { flow7Content } from '../../data/flow7Content.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { formatDisplayDateTime } from '../../vault/format.js'
import { adminPaths } from '../../admin/adminPaths.js'
import '../../styles/forms.css'
import '../../styles/vault.css'
import '../../styles/flow3-4.css'
import '../../styles/handover.css'
import '../../styles/admin.css'

// Flow 7 — shared Administration pieces.

// Flow 1 top bar + side menu (same layout as the Vault Owner area) + demo notice.
export function AdminLayout({ children }) {
  const { language } = useLanguage()
  const t = flow7Content[language].admin
  const links = [
    { to: adminPaths.overview, label: t.nav.overview, icon: 'home', end: true },
    { to: adminPaths.users, label: t.nav.users, icon: 'users' },
    { to: adminPaths.roles, label: t.nav.roles, icon: 'key' },
    { to: adminPaths.audit, label: t.nav.audit, icon: 'shieldCheck' },
    { to: adminPaths.policies, label: t.nav.policies, icon: 'lock' },
    { to: adminPaths.integrations, label: t.nav.integrations, icon: 'layers' },
  ]

  return (
    <DashboardLayout>
      <div className="owner-layout">
        <nav className="owner-nav" aria-label={t.nav.label}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="owner-nav__link">
              <Icon name={link.icon} size={17} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="owner-content">
          <p className="demo-banner">
            <Icon name="info" size={16} />
            <span>{t.demo}</span>
          </p>
          {children}
        </div>
      </div>
    </DashboardLayout>
  )
}

export function OutcomeBadge({ outcome, severity }) {
  const { language } = useLanguage()
  const t = flow7Content[language].audit
  const tone = outcome === 'SUCCESS' ? (severity === 'INFO' ? 'success' : 'warning') : 'danger'
  return (
    <span className={`handover-status handover-status--${tone}`}>
      <span className="handover-status__dot" aria-hidden="true" />
      {t.outcomes[outcome] ?? outcome}
      {severity && severity !== 'INFO' && ` · ${t.severities[severity]}`}
    </span>
  )
}

function formatDetails(details) {
  return Object.entries(details ?? {})
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join(' · ')
}

export function AuditTable({ entries }) {
  const { language } = useLanguage()
  const t = flow7Content[language].audit
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">{t.columns.time}</th>
            <th scope="col">{t.columns.actor}</th>
            <th scope="col">{t.columns.action}</th>
            <th scope="col">{t.columns.entity}</th>
            <th scope="col">{t.columns.outcome}</th>
            <th scope="col">{t.columns.details}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="admin-table__nowrap">
                {formatDisplayDateTime(entry.at)}
                {entry.seeded && <small className="admin-muted"> · {t.seeded}</small>}
              </td>
              <td>
                {entry.actor?.name ?? t.anonymous}
                {entry.actor?.role && <small className="admin-muted">{entry.actor.role}</small>}
              </td>
              <td>{t.actions[entry.action] ?? entry.action}</td>
              <td>
                {entry.entity ? `${entry.entity.type} ${entry.entity.id}` : '—'}
                {entry.caseId && entry.entity?.id !== entry.caseId && <small className="admin-muted">{entry.caseId}</small>}
              </td>
              <td><OutcomeBadge outcome={entry.outcome} severity={entry.severity} /></td>
              <td className="admin-table__details">{formatDetails(entry.details) || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
