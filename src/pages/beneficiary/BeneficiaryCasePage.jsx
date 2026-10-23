import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import FormField from '../../components/auth/FormField.jsx'
import Icon from '../../components/Icon.jsx'
import {
  ConfirmDialog,
  DenyReasons,
  HandoverLayout,
  HandoverStatusBadge,
  HandoverTimeline,
} from '../../components/handover/HandoverParts.jsx'
import { Breadcrumbs, ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { handoverContent, handoverErrorText } from '../../data/handoverContent.js'
import { checkAssetAccess } from '../../handover/handoverAccess.js'
import { HANDOVER_STATUS, hasReached } from '../../handover/handoverStatus.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import {
  confirmReceipt,
  getBeneficiaryCase,
  openAsset,
  recordAssetDownload,
  runAuthorizationCheck,
  verifyIdentity,
} from '../../services/handoverService.js'
import { formatFileSize } from '../../vault/documentRules.js'
import { formatDisplayDateTime } from '../../vault/format.js'

const LIST_PATH = '/dashboard/beneficiary'

// Flow 6 — Beneficiary handover case (steps 5–12): verify identity, authorization check,
// view authorized assets, confirm receipt. Every action is re-checked by the service.
export default function BeneficiaryCasePage() {
  const { caseId } = useParams()
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = handoverContent[language]
  const c = t.caseView
  const { status, data, error, reload } = useAsync(() => getBeneficiaryCase(user, caseId), `${user.id}:${caseId}`)
  // Case returned by the latest action (newer than the loaded one).
  const [updated, setUpdated] = useState(null)
  const handover = updated?.id === caseId ? updated : data

  return (
    <HandoverLayout>
      <Breadcrumbs label={t.back} items={[{ label: t.beneficiary.title, to: LIST_PATH }, { label: caseId }]} />

      {status === 'loading' && !handover && <LoadingState label={t.loading} />}
      {status === 'error' && (
        <ErrorState
          message={error?.code === 'CASE_NOT_FOUND' ? c.notFoundText : handoverErrorText(t, error)}
          retryLabel={t.retry}
          onRetry={error?.code === 'CASE_NOT_FOUND' ? undefined : reload}
        >
          <Button variant="secondary" to={LIST_PATH}>{c.toList}</Button>
        </ErrorState>
      )}
      {handover && status !== 'error' && <CaseView handover={handover} user={user} t={t} onChange={setUpdated} />}
    </HandoverLayout>
  )
}

function CaseView({ handover, user, t, onChange }) {
  const c = t.caseView
  const { status } = handover
  const stepDone = [
    hasReached(status, HANDOVER_STATUS.IDENTITY_VERIFIED),
    hasReached(status, HANDOVER_STATUS.READY_FOR_ACCESS),
    hasReached(status, HANDOVER_STATUS.RECEIPT_PENDING),
    status === HANDOVER_STATUS.COMPLETED,
  ]
  const current = stepDone.indexOf(false)

  return (
    <>
      <div className="page-head page-head--spaced">
        <div>
          <span className="handover-card__id">{t.caseId}</span>
          <h1 className="page-title">{handover.id}</h1>
          <p className="page-text">
            {t.vault}: {handover.vault.name} · {t.owner}: {handover.vault.ownerName} · {t.legalCase}: {handover.legalCaseId} ({t.legal[handover.legalStatus]})
          </p>
        </div>
        <HandoverStatusBadge status={status} />
      </div>

      <ol className="handover-steps" aria-label={t.handoverStatus}>
        {c.steps.map((label, index) => (
          <li
            key={label}
            className={stepDone[index] ? 'is-done' : index === current ? 'is-current' : ''}
            aria-current={index === current ? 'step' : undefined}
          >
            <span className="handover-steps__dot">{stepDone[index] ? <Icon name="check" size={13} /> : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="handover-columns handover-columns--case">
        <div className="handover-stack">
          {status === HANDOVER_STATUS.COMPLETED && (
            <section className="card handover-panel handover-panel--success" role="status">
              <span className="icon-tile"><Icon name="badgeCheck" /></span>
              <h2 className="section-title">{c.completedTitle}</h2>
              <p className="page-text">{c.completedText(formatDisplayDateTime(handover.completedAt))}</p>
            </section>
          )}
          {status === HANDOVER_STATUS.REJECTED && (
            <section className="card handover-panel" role="alert">
              <h2 className="section-title">{c.rejectedTitle}</h2>
              <DenyReasons reasons={['HANDOVER_REJECTED']} />
            </section>
          )}

          {status === HANDOVER_STATUS.BENEFICIARY_VERIFICATION_PENDING && (
            <VerifyPanel handover={handover} user={user} t={t} onChange={onChange} />
          )}
          {hasReached(status, HANDOVER_STATUS.IDENTITY_VERIFIED) && (
            <FormAlert tone="success">{c.verified}</FormAlert>
          )}
          {status === HANDOVER_STATUS.IDENTITY_VERIFIED && (
            <AuthorizationPanel handover={handover} user={user} t={t} onChange={onChange} />
          )}

          <AssetsPanel handover={handover} user={user} t={t} onChange={onChange} />

          {(status === HANDOVER_STATUS.READY_FOR_ACCESS || status === HANDOVER_STATUS.RECEIPT_PENDING) && (
            <ReceiptPanel handover={handover} user={user} t={t} onChange={onChange} />
          )}
        </div>

        <aside className="card handover-panel">
          <h2 className="section-title">{t.executor.timeline}</h2>
          <HandoverTimeline events={handover.timeline} />
        </aside>
      </div>
    </>
  )
}

const ONLY_DIGITS = /\D/g

function VerifyPanel({ handover, user, t, onChange }) {
  const c = t.caseView
  const [form, setForm] = useState({ otp: '', fullName: '', idNumber: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)
  const locked = handover.verification.locked

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const found = {}
    if (!/^\d{6}$/.test(form.otp)) found.otp = t.validation.otp
    if (!form.fullName.trim()) found.fullName = t.validation.fullName
    if (!/^(\d{9}|\d{12})$/.test(form.idNumber)) found.idNumber = t.validation.idNumber
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)
    setFailure(null)
    try {
      onChange(await verifyIdentity(user, handover.id, form))
    } catch (err) {
      setFailure(err)
      setForm((prev) => ({ ...prev, otp: '' }))
      if (err.code === 'VERIFICATION_LOCKED') {
        onChange({ ...handover, verification: { ...handover.verification, locked: true } })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card handover-panel" aria-labelledby="verify-title">
      <h2 id="verify-title" className="section-title"><Icon name="shieldCheck" size={17} /> {c.verifyTitle}</h2>
      <p className="page-text">{c.verifyText}</p>
      {failure && (
        <FormAlert>
          {handoverErrorText(t, failure)}
          {failure.details?.attemptsLeft > 0 && ` ${c.attemptsLeft(failure.details.attemptsLeft)}`}
        </FormAlert>
      )}
      {locked && !failure && <FormAlert>{t.errors.VERIFICATION_LOCKED}</FormAlert>}
      <form className="form-stack" onSubmit={submit} noValidate>
        <FormField
          id="ho-otp"
          label={c.otp}
          hint={c.otpHint}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={form.otp}
          onChange={(e) => set('otp', e.target.value.replace(ONLY_DIGITS, ''))}
          error={errors.otp}
          disabled={busy || locked}
        />
        <FormField
          id="ho-name"
          label={c.fullName}
          autoComplete="name"
          value={form.fullName}
          onChange={(e) => set('fullName', e.target.value)}
          error={errors.fullName}
          disabled={busy || locked}
        />
        <FormField
          id="ho-id"
          label={c.idNumber}
          hint={c.idHint}
          inputMode="numeric"
          autoComplete="off"
          maxLength={12}
          value={form.idNumber}
          onChange={(e) => set('idNumber', e.target.value.replace(ONLY_DIGITS, ''))}
          error={errors.idNumber}
          disabled={busy || locked}
        />
        <div className="form-actions">
          <Button type="submit" disabled={busy || locked}>
            {busy ? c.verifying : c.verify}
          </Button>
        </div>
      </form>
    </section>
  )
}

function AuthorizationPanel({ handover, user, t, onChange }) {
  const c = t.caseView
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)

  const run = async () => {
    setBusy(true)
    setFailure(null)
    try {
      onChange(await runAuthorizationCheck(user, handover.id))
    } catch (err) {
      setFailure(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card handover-panel" aria-labelledby="auth-title">
      <h2 id="auth-title" className="section-title"><Icon name="key" size={17} /> {c.authTitle}</h2>
      <p className="page-text">{c.authText}</p>
      {failure && (
        <FormAlert>
          {handoverErrorText(t, failure)}
          <DenyReasons reasons={failure.details?.reasons} />
        </FormAlert>
      )}
      <div className="form-actions">
        <Button onClick={run} disabled={busy}>{busy ? c.runningAuth : c.runAuth}</Button>
      </div>
    </section>
  )
}

function AssetsPanel({ handover, user, t, onChange }) {
  const c = t.caseView
  const [opened, setOpened] = useState({}) // assetId → content (kept in memory only)
  const [busyId, setBusyId] = useState(null)
  const [failure, setFailure] = useState(null)

  const reveal = async (assetId) => {
    setBusyId(assetId)
    setFailure(null)
    try {
      const result = await openAsset(user, handover.id, assetId)
      setOpened((prev) => ({ ...prev, [assetId]: result.content }))
      onChange(result.case)
    } catch (err) {
      setFailure({ assetId, error: err })
    } finally {
      setBusyId(null)
    }
  }

  // The right to download is checked (and audited) by the service before the file is built.
  const download = async (asset) => {
    setFailure(null)
    try {
      await recordAssetDownload(user, handover.id, asset.id)
    } catch (err) {
      setFailure({ assetId: asset.id, error: err })
      return
    }
    const isMock = opened[asset.id]?.includes('autumn · harbor · classic')
    const disclaimer = isMock ? `\n\n${c.demoDecrypt}\n` : ''
    const text = `${asset.name}\n${handover.id}\n\n${opened[asset.id]}${disclaimer}\n`
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${handover.id}-${asset.id}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="card handover-panel" aria-labelledby="assets-title">
      <h2 id="assets-title" className="section-title"><Icon name="unlock" size={17} /> {c.assetsTitle}</h2>
      <p className="page-text">{c.assetsText}</p>

      {(handover.assets?.length ?? 0) === 0 ? (
        <p className="handover-note">{c.noAssets}</p>
      ) : (
        <ul className="handover-assets">
          {(handover.assets || []).map((asset) => {
            const access = checkAssetAccess(user, handover, asset.id)
            const content = opened[asset.id]
            return (
              <li key={asset.id} className="handover-asset">
                <div className="handover-asset__head">
                  <div>
                    <h3 className="handover-subtitle">{asset.name}</h3>
                    <small>{t.categories[asset.category] ?? asset.category}</small>
                  </div>
                  <Icon name={access.allowed ? 'unlock' : 'lock'} size={18} />
                </div>
                {asset.description && <p className="page-text">{asset.description}</p>}

                <p className="handover-asset__label">{c.documents}</p>
                {(asset.documents?.length ?? 0) ? (
                  <ul className="file-list file-list--compact">
                    {(asset.documents || []).map((doc) => (
                      <li key={doc.id} className="file-list__item">
                        <span className="file-list__name"><Icon name="fileText" size={15} /> {doc.name}</span>
                        <span className="file-list__size">{formatFileSize(doc.size)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="handover-note">{c.noDocuments}</p>
                )}

                {content ? (
                  <div className="handover-secret" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                    {content.includes('|') ? (
                      <div className="handover-credentials-grid" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        {content.split('|').map((part, pIdx) => {
                          const [rawKey, ...rawVal] = part.split(':')
                          if (rawVal.length > 0) {
                            return (
                              <div key={pIdx} style={{ display: 'flex', gap: '8px', fontSize: '14px', alignItems: 'baseline' }}>
                                <strong style={{ minWidth: '70px', color: '#475569' }}>{rawKey.trim()}:</strong>
                                <span style={{ color: '#0f172a', fontWeight: 600 }}>{rawVal.join(':').trim()}</span>
                              </div>
                            )
                          }
                          return <p key={pIdx} style={{ margin: 0, fontWeight: 500 }}>{part.trim()}</p>
                        })}
                      </div>
                    ) : (
                      <p style={{ whiteSpace: 'pre-wrap', fontWeight: 500, margin: '0 0 10px 0' }}>{content}</p>
                    )}
                    {content.includes('autumn · harbor · classic') && (
                      <small><Icon name="info" size={13} /> {c.demoDecrypt}</small>
                    )}
                    {access.allowed && (
                      <Button variant="secondary" size="sm" onClick={() => download(asset)}>{c.download}</Button>
                    )}
                  </div>
                ) : access.allowed ? (
                  <Button variant="secondary" size="sm" onClick={() => reveal(asset.id)} disabled={busyId === asset.id}>
                    <Icon name="eye" size={15} /> {busyId === asset.id ? c.revealing : c.reveal}
                  </Button>
                ) : (
                  <div className="handover-locked">
                    <p className="handover-note">{c.lockedAsset}</p>
                    <DenyReasons reasons={access.reasons} />
                  </div>
                )}

                {failure?.assetId === asset.id && (
                  <FormAlert>
                    {c.accessDenied}: {handoverErrorText(t, failure.error)}
                    <DenyReasons reasons={failure.error.details?.reasons} />
                  </FormAlert>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function ReceiptPanel({ handover, user, t, onChange }) {
  const c = t.caseView
  const [dialog, setDialog] = useState(false)
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)
  const canConfirm = handover.status === HANDOVER_STATUS.RECEIPT_PENDING

  const confirm = async () => {
    // Guard against double clicks: the service also refuses a second completion.
    if (busy) return
    setBusy(true)
    setFailure(null)
    try {
      onChange(await confirmReceipt(user, handover.id))
      setDialog(false)
    } catch (err) {
      setFailure(err)
    } finally {
      setBusy(false)
    }
  }

  const close = () => {
    setDialog(false)
    setChecked(false)
  }

  return (
    <section className="card handover-panel" aria-labelledby="receipt-title">
      <h2 id="receipt-title" className="section-title"><Icon name="check" size={17} /> {c.receiptTitle}</h2>
      <p className="page-text">{c.receiptText}</p>
      {!canConfirm && <p className="handover-note"><Icon name="info" size={14} /> {c.receiptNeedsAccess}</p>}
      {failure && !dialog && <FormAlert>{handoverErrorText(t, failure)}</FormAlert>}
      <div className="form-actions">
        <Button onClick={() => setDialog(true)} disabled={!canConfirm || busy}>{c.confirmReceipt}</Button>
      </div>

      {dialog && (
        <ConfirmDialog
          title={c.receiptDialogTitle}
          busy={busy}
          onClose={close}
          actions={
            <>
              <Button variant="secondary" onClick={close} disabled={busy}>{c.cancel}</Button>
              <Button onClick={confirm} disabled={!checked || busy}>{busy ? c.confirming : c.confirmReceipt}</Button>
            </>
          }
        >
          <p className="page-text">{c.receiptDialogText}</p>
          <label className="handover-check">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span>{c.receiptCheck}</span>
          </label>
          {failure && <FormAlert>{handoverErrorText(t, failure)}</FormAlert>}
        </ConfirmDialog>
      )}
    </section>
  )
}
