import { NavLink, matchPath, useLocation } from 'react-router-dom'
import DashboardLayout from '../dashboard/DashboardLayout.jsx'
import Icon from '../Icon.jsx'
import { vaultContent } from '../../data/vaultContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { IS_DEMO_MODE } from '../../services/vaultService.js'
import { ownerPaths } from '../../vault/paths.js'
import '../../styles/forms.css'
import '../../styles/vault.css'
import '../../styles/flow3-4.css'
import '../../styles/app-shell.css'

// Frame for the Vault Owner pages: an app shell with a full-height side menu (grouped links,
// the signed-in user) and a slim top bar with a breadcrumb, plus the demo-data notice.
export default function OwnerLayout({ children, showDemoBanner = true, showThemeToggle = true }) {
  const { language } = useLanguage()
  const { pathname } = useLocation()
  const isVi = language === 'vi'
  const t = vaultContent[language]

  const groups = [
    {
      label: isVi ? 'Kho di sản' : 'Vault',
      links: [
        { to: ownerPaths.dashboard, label: t.nav.overview, icon: 'home', end: true },
        { to: ownerPaths.assets, label: isVi ? 'Tài sản của tôi' : 'My Assets', icon: 'key' },
      ],
    },
    {
      label: isVi ? 'Bàn giao' : 'Legacy',
      links: [
        { to: ownerPaths.contacts, label: t.nav.contacts, icon: 'users' },
        { to: ownerPaths.assignments, label: t.nav.assignments, icon: 'layers' },
        { to: ownerPaths.dms, label: t.nav.dms, icon: 'shield' },
      ],
    },
    {
      label: isVi ? 'Tài khoản' : 'Account',
      links: [
        { to: ownerPaths.billing, label: isVi ? 'Gói & thanh toán' : 'Plan & billing', icon: 'creditCard' },
      ],
    },
  ]

  // Breadcrumb: "Group / Page" for the link that matches the current address.
  let crumb = null
  for (const group of groups) {
    const link = group.links.find((item) =>
      matchPath({ path: item.to, end: Boolean(item.end) }, pathname),
    )
    if (link) {
      crumb = { group: group.label, page: link.label }
      break
    }
  }

  const sidebar = (
    <nav className="owner-nav" aria-label={t.nav.label}>
      {groups.map((group) => (
        <div key={group.label} className="owner-nav__group">
          <span className="owner-nav__group-label">{group.label}</span>
          {group.links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="owner-nav__link">
              <span className="owner-nav__icon" aria-hidden="true">
                <Icon name={link.icon} size={16} />
              </span>
              <span className="owner-nav__text">{link.label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )

  const breadcrumb = crumb && (
    <nav className="app-breadcrumb" aria-label={isVi ? 'Vị trí' : 'Breadcrumb'}>
      <span className="app-breadcrumb__group">{crumb.group}</span>
      <Icon name="chevronRight" size={14} />
      <span className="app-breadcrumb__page" aria-current="page">
        {crumb.page}
      </span>
    </nav>
  )

  return (
    <DashboardLayout showThemeToggle={showThemeToggle} sidebar={sidebar} topbarStart={breadcrumb}>
      <div className="owner-content">
        {showDemoBanner && IS_DEMO_MODE && (
          <p className="demo-banner">
            <Icon name="info" size={16} />
            <span>{t.demoNotice}</span>
          </p>
        )}
        {children}
      </div>
    </DashboardLayout>
  )
}
