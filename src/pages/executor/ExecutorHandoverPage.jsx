import { useState } from 'react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import Icon from '../../components/Icon.jsx'
import {
  ConfirmDialog,
  HandoverLayout,
  HandoverStatusBadge,
  HandoverTimeline,
} from '../../components/handover/HandoverParts.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { handoverContent, handoverErrorText } from '../../data/handoverContent.js'
import { HANDOVER_STATUS, canStartHandover, hasReached } from '../../handover/handoverStatus.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { IS_DEMO_MODE, listExecutorCases, resetDemoHandovers, startHandover } from '../../services/handoverService.js'
import { formatDisplayDateTime } from '../../vault/format.js'

// Flow 6 — Executor / Trustee: list of handover cases and the Start Handover action
// (steps 1–4: legal approval → start → identify beneficiary → notify).
export default function ExecutorHandoverPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = handoverContent[language]
  const { status, data: cases, error, reload } = useAsync(() => listExecutorCases(user), user.id)

  const [confirming, setConfirming] = useState(null) // case waiting for confirmation
  const [busyId, setBusyId] = useState(null)
  const [feedback, setFeedback] = useState(null) // { tone, text, caseId }

  const doStart = async () => {
    const handover = confirming
    setBusyId(handover.id)
    setFeedback(null)
    try {
      await startHandover(user, handover.id)
      setFeedback({ tone: 'success', text: t.executor.started(handover.id), caseId: handover.id })
      reload()
    } catch (err) {
      setFeedback({ tone: 'error', text: handoverErrorText(t, err), caseId: handover.id })
    } finally {
      setBusyId(null)
      setConfirming(null)
    }
  }

  const resetDemo = () => {
    resetDemoHandovers(user)
    setFeedback(null)
    reload()
  }

  const list = cases ?? []
  const stats = {
    total: list.length,
    waiting: list.filter((c) => c.status === HANDOVER_STATUS.PENDING_LEGAL_APPROVAL).length,
    active: list.filter((c) => hasReached(c.status, HANDOVER_STATUS.HANDOVER_INITIATED) && c.status !== HANDOVER_STATUS.COMPLETED).length,
    done: list.filter((c) => c.status === HANDOVER_STATUS.COMPLETED).length,
  }

  return (
    <HandoverLayout>
      <div className="page-head">
        <div>
          <span className="badge badge--accent">{t.executor.nav}</span>
          <h1 className="page-title">{t.executor.title}</h1>
          <p className="page-text">{t.executor.text}</p>
        </div>
        {IS_DEMO_MODE && (
          <div className="page-head__actions">
            <Button variant="secondary" size="sm" onClick={resetDemo}>
              {t.executor.reset}
            </Button>
          </div>
        )}
      </div>

      {status === 'loading' && <LoadingState label={t.loading} />}
      {status === 'error' && <ErrorState message={handoverErrorText(t, error)} retryLabel={t.retry} onRetry={reload} />}

      {status === 'ready' && (
        <>
          <dl className="stat-grid handover-stats">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="card stat-card">
                <dt>{t.executor.stats[key]}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {list.length === 0 ? (
            <EmptyState icon="inbox" title={t.executor.emptyTitle} text={t.executor.emptyText} />
          ) : (
            <div className="handover-list">
              {list.map((handover) => (
                <ExecutorCaseCard
                  key={handover.id}
                  handover={handover}
                  t={t}
                  busy={busyId === handover.id}
                  feedback={feedback?.caseId === handover.id ? feedback : null}
                  onStart={() => setConfirming(handover)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {confirming && (
        <ConfirmDialog
          title={t.executor.startConfirmTitle(confirming.id)}
          busy={Boolean(busyId)}
          onClose={() => setConfirming(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirming(null)} disabled={Boolean(busyId)}>
                {t.executor.cancel}
              </Button>
              <Button onClick={doStart} disabled={Boolean(busyId)}>
                {busyId ? t.executor.starting : t.executor.confirm}
              </Button>
            </>
          }
        >
          <p className="page-text">{t.executor.startConfirmText(`${confirming.beneficiary.name} (${confirming.beneficiary.email})`)}</p>
        </ConfirmDialog>
      )}
    </HandoverLayout>
  )
}

function ExecutorCaseCard({ handover, t, busy, feedback, onStart }) {
  const startable = canStartHandover(handover)
  const blockedText = t.executor.blocked[handover.status]
  const started = hasReached(handover.status, HANDOVER_STATUS.HANDOVER_INITIATED)

  return (
    <article className="card handover-card" aria-labelledby={`case-${handover.id}`}>
      <header className="handover-card__head">
        <div>
          <span className="handover-card__id">{t.caseId}</span>
          <h2 id={`case-${handover.id}`} className="section-title">{handover.id}</h2>
        </div>
        <HandoverStatusBadge status={handover.status} />
      </header>

      <dl className="handover-facts">
        <div>
          <dt>{t.beneficiaryLabel}</dt>
          <dd>
            {handover.beneficiary.name}
            <small>{handover.beneficiary.email}</small>
          </dd>
        </div>
        <div>
          <dt>{t.vault}</dt>
          <dd>
            {handover.vault.name}
            <small>{t.owner}: {handover.vault.owner.name}</small>
          </dd>
        </div>
        <div>
          <dt>{t.legalCase}</dt>
          <dd>
            {handover.legalCaseId}
            <small className={`handover-legal handover-legal--${handover.legalStatus}`}>{t.legal[handover.legalStatus]}</small>
          </dd>
        </div>
      </dl>

      {handover.assets.length > 0 && (
        <div>
          <h3 className="handover-subtitle">{t.assets} ({handover.assets.length})</h3>
          <ul className="handover-asset-chips">
            {handover.assets.map((asset) => (
              <li key={asset.id} className={asset.forThisBeneficiary ? '' : 'is-muted'}>
                <Icon name={asset.forThisBeneficiary ? 'unlock' : 'lock'} size={14} />
                {asset.name}
                <small>{t.categories[asset.category] ?? asset.category} · {asset.forThisBeneficiary ? t.executor.assetFor : t.executor.assetNotFor}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {handover.rejectionReason && <p className="handover-note handover-note--danger">{handover.rejectionReason}</p>}

      {feedback && <FormAlert tone={feedback.tone}>{feedback.text}</FormAlert>}

      <footer className="handover-card__actions">
        {startable && (
          <Button onClick={onStart} disabled={busy}>
            <Icon name="arrowRight" size={16} />
            {busy ? t.executor.starting : t.executor.start}
          </Button>
        )}
        {!startable && blockedText && (
          <p className="handover-note"><Icon name="lock" size={14} /> {blockedText}</p>
        )}
        {started && handover.status !== HANDOVER_STATUS.COMPLETED && (
          <p className="handover-note"><Icon name="info" size={14} /> {t.executor.inProgress}</p>
        )}
        {handover.status === HANDOVER_STATUS.COMPLETED && (
          <p className="handover-note handover-note--success">
            <Icon name="check" size={14} /> {t.executor.completed(formatDisplayDateTime(handover.completedAt))}
          </p>
        )}
      </footer>

      {handover.timeline.length > 0 && (
        <details className="handover-details">
          <summary>{t.executor.timeline}</summary>
          <HandoverTimeline events={handover.timeline} />
        </details>
      )}
    </article>
  )
}
