import { useState } from 'react'
import { Info, RefreshCw, Settings2 } from 'lucide-react'
import Button from '../../components/Button.jsx'
import VerifierLayout from '../../components/verifier/VerifierLayout.jsx'
import { verifierContent } from '../../data/verifierContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { DEMO_MODE, resetDemoCases } from '../../services/verificationService.js'

export default function VerifierSettingsPage() {
  const { language } = useLanguage()
  const t = verifierContent[language] || verifierContent.en
  const s = t.settings
  const [resetMessage, setResetMessage] = useState('')

  const handleReset = () => {
    resetDemoCases()
    setResetMessage(s.resetSuccess)
    setTimeout(() => setResetMessage(''), 3000)
  }

  return (
    <VerifierLayout>
      <header className="verifier-page-header">
        <div className="verifier-heading-copy">
          <span className="badge badge--accent">{t.badge}</span>
          <h1 className="page-title">{t.titles.settings}</h1>
          <p className="page-text">{t.descriptions.settings}</p>
        </div>
      </header>

      <div className="settings-layout">
        <div className="feature-panel settings-card">
          <div className="feature-heading">
            <span className="feature-symbol">
              <Settings2 size={22} />
            </span>
            <div>
              <h2>{s.title}</h2>
              <p>{s.subtitle}</p>
            </div>
          </div>

          <div className="setting-item">
            <div>
              <strong>{s.authTitle}</strong>
              <p>{s.authDesc}</p>
            </div>
            <span className="read-only">{s.backendRequired}</span>
          </div>

          <div className="setting-item">
            <div>
              <strong>{s.docTitle}</strong>
              <p>{s.docDesc}</p>
            </div>
            <span className="read-only">{s.backendRequired}</span>
          </div>

          <div className="setting-item">
            <div>
              <strong>{s.signTitle}</strong>
              <p>{s.signDesc}</p>
            </div>
            <span className="read-only">{s.backendRequired}</span>
          </div>

          <p className="inline-note">
            <Info size={15} />
            <span>{s.yamlNote}</span>
          </p>
        </div>

        {DEMO_MODE && (
          <div className="feature-panel reset-panel">
            <h2>{s.demoDataTitle}</h2>
            <p>{s.demoDataDesc}</p>
            <Button variant="secondary" onClick={handleReset}>
              <RefreshCw size={15} />
              <span>{s.resetBtn}</span>
            </Button>
            {resetMessage && (
              <p className="form-error" style={{ color: 'var(--color-primary)' }}>
                {resetMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </VerifierLayout>
  )
}
