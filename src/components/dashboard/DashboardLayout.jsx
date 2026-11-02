import { useState } from 'react'
import Brand from '../Brand.jsx'
import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import LanguageSwitcher from '../LanguageSwitcher.jsx'
import ThemeToggle from '../ThemeToggle.jsx'
import { NotificationBell } from '../notifications/NotificationParts.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { dashboardContent } from '../../data/dashboardContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import '../../styles/dashboard.css'

// Frame for every signed-in page: top bar with the user, their role, and Log out.
export default function DashboardLayout({ children, showThemeToggle = true }) {
  const { user, logout } = useAuth()
  const { language } = useLanguage()
  const t = dashboardContent[language]
  const [loggingOut, setLoggingOut] = useState(false)

  // Clearing the session is enough: RequireAuth (src/auth/guards.jsx) then sends
  // the user to /login, so there is only one place that decides where to go.
  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div className="container dashboard-topbar__inner">
          <Brand to="/" />
          <div className="dashboard-topbar__end">
            <div className="dashboard-user">
              <span className="dashboard-user__name">{user.fullName}</span>
              <span className="badge">{t.roles[user.role].label}</span>
            </div>
            <NotificationBell />
            {showThemeToggle && <ThemeToggle />}
            <LanguageSwitcher label={t.languageLabel} />
            {/* aria-label keeps the button named on phones, where only the icon shows */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label={loggingOut ? t.loggingOut : t.logout}
            >
              <Icon name="logOut" size={16} />
              <span className="dashboard-topbar__logout-text">
                {loggingOut ? t.loggingOut : t.logout}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container dashboard-main">{children}</main>
    </div>
  )
}
