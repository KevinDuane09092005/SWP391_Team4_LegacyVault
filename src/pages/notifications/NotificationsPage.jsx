import { useState } from 'react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import DashboardLayout from '../../components/dashboard/DashboardLayout.jsx'
import Icon from '../../components/Icon.jsx'
import { NotificationList } from '../../components/notifications/NotificationParts.jsx'
import useMyNotifications from '../../hooks/useMyNotifications.js'
import { EmptyState, ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { getDashboardPath } from '../../auth/roles.js'
import { flow7Content, flow7ErrorText } from '../../data/flow7Content.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { IS_DEMO_MODE, markAllNotificationsRead, markNotificationRead } from '../../services/notificationService.js'
import '../../styles/vault.css'
import '../../styles/admin.css'

// Flow 7 — Notification Center for every signed-in role. Shows only the user's own notifications.
export default function NotificationsPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = flow7Content[language]
  const n = t.notifications
  const { status, items, error, reload } = useMyNotifications()
  const [filter, setFilter] = useState('ALL')
  const [actionError, setActionError] = useState(null)

  const run = async (action) => {
    setActionError(null)
    try {
      await action()
    } catch (err) {
      setActionError(err)
    }
  }

  const shown = filter === 'UNREAD' ? items.filter((item) => !item.read) : items
  const unread = items.filter((item) => !item.read).length

  return (
    <DashboardLayout>
      {IS_DEMO_MODE && (
        <p className="demo-banner">
          <Icon name="info" size={16} />
          <span>{n.demo}</span>
        </p>
      )}
      <div className="page-head">
        <div>
          <h1 className="page-title">{n.title}</h1>
          <p className="page-text">{n.text}</p>
        </div>
        <div className="page-head__actions">
          <Button variant="secondary" size="sm" to={getDashboardPath(user.role)} icon="arrowRight">
            Dashboard
          </Button>
          <Button size="sm" onClick={() => run(() => markAllNotificationsRead(user))} disabled={!unread}>
            {n.markAll}
          </Button>
        </div>
      </div>

      <div className="segmented" role="group" aria-label={n.title}>
        {['ALL', 'UNREAD'].map((key) => (
          <button key={key} type="button" className={filter === key ? 'is-active' : ''} aria-pressed={filter === key}
            onClick={() => setFilter(key)}>
            {key === 'ALL' ? n.filterAll : `${n.filterUnread} (${unread})`}
          </button>
        ))}
      </div>

      {actionError && <FormAlert>{flow7ErrorText(t, actionError)}</FormAlert>}
      {status === 'loading' && <LoadingState label={t.loading} />}
      {status === 'error' && <ErrorState message={flow7ErrorText(t, error)} retryLabel={t.retry} onRetry={reload} />}
      {status === 'ready' && (shown.length === 0
        ? <EmptyState icon="inbox" title={n.emptyTitle} text={n.emptyText} />
        : <NotificationList items={shown} onMarkRead={(id) => run(() => markNotificationRead(user, id))} />)}
    </DashboardLayout>
  )
}
