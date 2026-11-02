import { NavLink } from 'react-router-dom'
import DashboardLayout from '../dashboard/DashboardLayout.jsx'
import Icon from '../Icon.jsx'
import { vaultContent } from '../../data/vaultContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { IS_DEMO_MODE } from '../../services/vaultService.js'
import { ownerPaths } from '../../vault/paths.js'
import '../../styles/forms.css'
import '../../styles/vault.css'
import '../../styles/flow3-4.css'

// Frame for the Vault Owner pages: the Flow 1 dashboard top bar (user, role, Log out)
// plus a side menu and the demo-data notice.
export default function OwnerLayout({ children, showDemoBanner = true, showThemeToggle = true }) {
  const { language } = useLanguage()
  const t = vaultContent[language]

  const links = [
    { to: ownerPaths.dashboard, label: t.nav.overview, icon: 'home', end: true },
    { to: ownerPaths.assets, label: language === 'vi' ? 'Tài sản của tôi' : 'My Assets', icon: 'key' },
    { to: ownerPaths.contacts, label: t.nav.contacts, icon: 'users' },
    { to: ownerPaths.assignments, label: t.nav.assignments, icon: 'layers' },
    { to: ownerPaths.dms, label: t.nav.dms, icon: 'shield' },
    { to: ownerPaths.billing, label: language === 'vi' ? 'Gói & thanh toán' : 'Plan & billing', icon: 'creditCard' },
  ]

  return (
    <DashboardLayout showThemeToggle={showThemeToggle}>
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
          {showDemoBanner && IS_DEMO_MODE && (
            <p className="demo-banner">
              <Icon name="info" size={16} />
              <span>{t.demoNotice}</span>
            </p>
          )}
          {children}
        </div>
      </div>
    </DashboardLayout>
  )
}
