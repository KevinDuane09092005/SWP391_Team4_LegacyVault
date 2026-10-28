import { NavLink } from 'react-router-dom'
import DashboardLayout from '../dashboard/DashboardLayout.jsx'
import Icon from '../Icon.jsx'
import { verifierContent } from '../../data/verifierContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { IS_DEMO_MODE } from '../../services/verificationService.js'
import '../../styles/forms.css'
import '../../styles/vault.css'
import '../../styles/verifier.css'

export default function VerifierLayout({ children }) {
  const { language } = useLanguage()
  const t = verifierContent[language] || verifierContent.en

  const links = [
    { to: '/dashboard/verifier', label: t.nav.queue, icon: 'users', end: true },
    { to: '/dashboard/verifier/history', label: t.nav.history, icon: 'grid' },
    // { to: '/dashboard/verifier/settings', label: t.nav.settings, icon: 'settings' },
  ]

  return (
    <DashboardLayout>
      <div className="verifier-layout">
        <aside className="verifier-nav" aria-label={t.badge}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `verifier-nav__link ${isActive ? 'active' : ''}`
              }
            >
              <Icon name={link.icon} size={17} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </aside>

        <div className="verifier-content">
          {IS_DEMO_MODE && (
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
