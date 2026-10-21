import { useEffect, useRef } from 'react'
import DashboardLayout from '../dashboard/DashboardLayout.jsx'
import Icon from '../Icon.jsx'
import { handoverContent } from '../../data/handoverContent.js'
import { statusTone } from '../../handover/handoverStatus.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { IS_DEMO_MODE } from '../../services/handoverService.js'
import { formatDisplayDateTime } from '../../vault/format.js'
import '../../styles/forms.css'
import '../../styles/vault.css'
import '../../styles/flow3-4.css'
import '../../styles/handover.css'

// Shared building blocks for the Flow 6 pages.

// Flow 1 dashboard frame + the demo notice.
export function HandoverLayout({ children }) {
  const { language } = useLanguage()
  const t = handoverContent[language]
  return (
    <DashboardLayout>
      {IS_DEMO_MODE && (
        <p className="demo-banner">
          <Icon name="info" size={16} />
          <span>{t.demoNotice}</span>
        </p>
      )}
      {children}
    </DashboardLayout>
  )
}

export function HandoverStatusBadge({ status }) {
  const { language } = useLanguage()
  const t = handoverContent[language]
  return (
    <span className={`handover-status handover-status--${statusTone(status)}`}>
      <span className="handover-status__dot" aria-hidden="true" />
      {t.status[status] ?? status}
    </span>
  )
}

export function HandoverTimeline({ events }) {
  const { language } = useLanguage()
  const t = handoverContent[language]
  if (!events?.length) return null
  return (
    <ol className="handover-timeline">
      {events.map((event, index) => (
        <li key={`${event.type}-${index}`} className={`handover-timeline__item handover-timeline__item--${event.type}`}>
          <span className="handover-timeline__dot" aria-hidden="true" />
          <div>
            <b>{t.events[event.type] ?? event.type}</b>
            <small>{formatDisplayDateTime(event.at)}</small>
          </div>
        </li>
      ))}
    </ol>
  )
}

// Confirmation dialog (reuses the Flow 3/4 modal styles). Escape closes it unless busy.
export function ConfirmDialog({ title, children, onClose, actions, busy }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  return (
    <div className="flow-modal-overlay">
      <div className="flow-modal" role="dialog" aria-modal="true" aria-labelledby="handover-dialog-title" tabIndex={-1} ref={ref}>
        <h2 id="handover-dialog-title" className="section-title">{title}</h2>
        <div className="handover-dialog__body">{children}</div>
        <div className="flow-modal-actions">{actions}</div>
      </div>
    </div>
  )
}

// List of deny reasons from handoverAccess.js, translated.
export function DenyReasons({ reasons }) {
  const { language } = useLanguage()
  const t = handoverContent[language]
  if (!reasons?.length) return null
  return (
    <ul className="handover-deny">
      {reasons.map((code) => (
        <li key={code}>
          <Icon name="lock" size={14} />
          {t.denyReasons[code] ?? code}
        </li>
      ))}
    </ul>
  )
}
