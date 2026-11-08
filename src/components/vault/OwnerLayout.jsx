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
// plus a grouped SaaS side menu and the demo-data notice.
export default function OwnerLayout({ children, showDemoBanner = true, showThemeToggle = true }) {
  const { language } = useLanguage()
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

  return (
    <DashboardLayout showThemeToggle={showThemeToggle}>
      <div className="owner-layout">
        <nav className="owner-nav" aria-label={t.nav.label}>
          <div className="owner-nav__head">
            <Icon name="shieldCheck" size={15} />
            <span>{isVi ? 'Không gian Vault' : 'Vault Workspace'}</span>
          </div>

          {groups.map((group, groupIndex) => (
            <div key={group.label} className="owner-nav__group">
              {groupIndex > 0 && <span className="owner-nav__divider" aria-hidden="true" />}
              <span className="owner-nav__group-label">{group.label}</span>
              {group.links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className="owner-nav__link">
                  <span className="owner-nav__icon" aria-hidden="true">
                    <Icon name={link.icon} size={15} />
                  </span>
                  <span className="owner-nav__text">{link.label}</span>
                </NavLink>
              ))}
            </div>
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
