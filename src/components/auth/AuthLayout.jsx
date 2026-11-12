import { Link } from 'react-router-dom'
import Brand from '../Brand.jsx'
import Icon from '../Icon.jsx'
import LegacyIllustration from '../decor/LegacyIllustration.jsx'
import LanguageSwitcher from '../LanguageSwitcher.jsx'
import ThemeToggle from '../ThemeToggle.jsx'
import { authContent } from '../../data/authContent.js'
import { landingContent } from '../../data/landingContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import '../../styles/marketing.css'
import '../../styles/forms.css'
import '../../styles/auth.css'

// Frame shared by every auth page: top bar, brand panel on the left, card on the right.
// `activeTab` ('signup' | 'signin') shows the Sign Up / Sign In tabs; leave it out to hide them.
export default function AuthLayout({ activeTab, titleId = 'auth-title', children }) {
  const { language } = useLanguage()
  const t = authContent[language]

  return (
    <div className="marketing-page auth-page">
      <header className="auth-topbar">
        <div className="container auth-topbar__inner">
          <Brand to="/" label={landingContent[language].ui.brandLabel} />
          <div className="auth-topbar__end">
            <ThemeToggle />
            <LanguageSwitcher label={t.languageLabel} />
            <Link to="/home" className="auth-topbar__back">
              <Icon name="arrowLeft" size={16} />
              <span>{t.backHome}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container auth-main">
        <div className="auth-layout">
          <aside className="auth-panel">
            <span className="auth-panel__mark" aria-hidden="true">
              <Icon name="shieldCheck" size={26} strokeWidth={1.8} />
            </span>
            <h2 className="auth-panel__title">{t.panel.title}</h2>
            <ul className="auth-panel__points">
              {t.panel.points.map((point) => (
                <li key={point}>
                  <Icon name="check" size={18} strokeWidth={2.2} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <LegacyIllustration className="auth-panel__art" tone="light" />
          </aside>

          <section className="card auth-card" aria-labelledby={titleId}>
            {activeTab && (
              <nav className="auth-tabs" aria-label={t.tabsLabel}>
                <Link
                  to="/register"
                  className="auth-tabs__tab"
                  aria-current={activeTab === 'signup' ? 'page' : undefined}
                >
                  {t.tabs.signup}
                </Link>
                <Link
                  to="/login"
                  className="auth-tabs__tab"
                  aria-current={activeTab === 'signin' ? 'page' : undefined}
                >
                  {t.tabs.signin}
                </Link>
              </nav>
            )}
            {children}
          </section>
        </div>
      </main>
    </div>
  )
}
