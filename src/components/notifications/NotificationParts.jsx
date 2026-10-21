import { Link } from 'react-router-dom'
import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { flow7Content } from '../../data/flow7Content.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import useMyNotifications from '../../hooks/useMyNotifications.js'
import { notificationLink } from '../../notifications/notificationLink.js'
import { formatDisplayDateTime } from '../../vault/format.js'

// Flow 7 — shared notification pieces: the top-bar bell and the notification list.

export function NotificationBell() {
  const { language } = useLanguage()
  const t = flow7Content[language].notifications
  const { items } = useMyNotifications()
  const unread = items.filter((item) => !item.read).length

  return (
    <Link to="/dashboard/notifications" className="notification-bell" aria-label={t.bell(unread)} title={t.bell(unread)}>
      <Icon name="mail" size={18} />
      {unread > 0 && <span className="notification-bell__count">{unread > 9 ? '9+' : unread}</span>}
    </Link>
  )
}

export function NotificationList({ items, onMarkRead }) {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = flow7Content[language].notifications

  return (
    <ul className="notification-list">
      {items.map((item) => {
        const text = t.types[item.type]
        const link = notificationLink(user, item)
        return (
          <li key={item.id} className={`notification-item${item.read ? '' : ' is-unread'}`}>
            <div className="notification-item__head">
              <strong>{text?.title ?? item.type}</strong>
              {!item.read && <span className="badge badge--accent">{t.unread}</span>}
            </div>
            <p>{text ? text.text(item.params ?? {}) : ''}</p>
            <small>
              {formatDisplayDateTime(item.createdAt)}
              {item.caseId && ` · ${t.case} ${item.caseId}`}
            </small>
            <div className="notification-item__actions">
              {link && (
                <Button variant="secondary" size="sm" to={link} onClick={() => !item.read && onMarkRead?.(item.id)}>
                  {t.open}
                </Button>
              )}
              {!item.read && onMarkRead && (
                <button type="button" className="btn btn-link btn-sm" onClick={() => onMarkRead(item.id)}>
                  {t.markRead}
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
