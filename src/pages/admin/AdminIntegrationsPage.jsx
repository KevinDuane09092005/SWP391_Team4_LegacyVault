import { useState } from 'react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import { AdminLayout } from '../../components/admin/AdminParts.jsx'
import { ConfirmDialog } from '../../components/handover/HandoverParts.jsx'
import { ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { flow7Content, flow7ErrorText } from '../../data/flow7Content.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { listIntegrations, setIntegration } from '../../services/adminService.js'

const CHATBOT_INTEGRATION_ID = 'ai-assistant'

// Flow 7 — Third-party integrations.
export default function AdminIntegrationsPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = flow7Content[language]
  const g = t.admin.integrations
  const { status, data, error, reload } = useAsync(() => listIntegrations(user), user.id)
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const chatbot = data?.find((item) => item.id === CHATBOT_INTEGRATION_ID)
  const integrationItems = [
    ...(data ?? []).filter((item) => item.id !== CHATBOT_INTEGRATION_ID),
    {
      ...chatbot,
      id: CHATBOT_INTEGRATION_ID,
      name: g.chatbotName,
      category: 'AI',
      enabled: chatbot?.enabled ?? false,
    },
  ]

  const apply = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await setIntegration(user, pending.id, !pending.enabled)
      setMessage({ tone: 'success', text: t.saved })
      reload()
    } catch (err) {
      setMessage({ tone: 'error', text: flow7ErrorText(t, err) })
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1 className="page-title">{g.title}</h1>
          <p className="page-text">{g.text}</p>
        </div>
      </div>
      {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}
      {status === 'loading' && <LoadingState label={t.loading} />}
      {status === 'error' && <ErrorState message={flow7ErrorText(t, error)} retryLabel={t.retry} onRetry={reload} />}
      {status === 'ready' && (
        <div className="admin-integrations">
          {integrationItems.map((item) => (
            <article key={item.id} className="card handover-panel">
              <div className="handover-card__head">
                <div>
                  <h2 className="section-title">{item.name}</h2>
                  <small className="admin-muted">
                    {g.categories[item.category] ?? item.category} ·{' '}
                    {item.connectionStatus === 'DEGRADED'
                      ? g.degraded
                      : item.connectionStatus === 'HEALTHY' || item.enabled
                        ? g.connected
                        : g.notConnected}
                  </small>
                </div>
                <span className={`handover-status handover-status--${item.enabled ? 'info' : 'neutral'}`}>
                  <span className="handover-status__dot" aria-hidden="true" />
                  {item.enabled ? g.status.on : g.status.off}
                </span>
              </div>
              <div>
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => setPending(item)}>
                  {item.enabled ? g.disable : g.enable}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {pending && (
        <ConfirmDialog
          title={g.confirm(!pending.enabled, pending.name)}
          busy={busy}
          onClose={() => setPending(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setPending(null)} disabled={busy}>{t.cancel}</Button>
              <Button onClick={apply} disabled={busy}>{busy ? t.saving : t.confirm}</Button>
            </>
          }
        >
          <p className="page-text">{g.confirmText}</p>
        </ConfirmDialog>
      )}
    </AdminLayout>
  )
}
