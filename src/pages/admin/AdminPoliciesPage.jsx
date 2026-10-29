import { useState } from 'react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import FormField from '../../components/auth/FormField.jsx'
import { AdminLayout, PrototypeOnlyNotice } from '../../components/admin/AdminParts.jsx'
import { ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { flow7Content, flow7ErrorText } from '../../data/flow7Content.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getPolicies, savePolicies } from '../../services/adminService.js'

// Flow 7 — Encryption, backup & Dead Man's Switch policy settings.
export default function AdminPoliciesPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = flow7Content[language]
  const { status, data, error, reload } = useAsync(() => getPolicies(user), user.id)

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.admin.policies.title}</h1>
          <p className="page-text">{t.admin.policies.text}</p>
        </div>
      </div>
      <PrototypeOnlyNotice />
      {status === 'loading' && <LoadingState label={t.loading} />}
      {status === 'error' && <ErrorState message={flow7ErrorText(t, error)} retryLabel={t.retry} onRetry={reload} />}
      {status === 'ready' && <PolicyForm key={JSON.stringify(data.policies)} initial={data.policies} options={data.options} />}
    </AdminLayout>
  )
}

function PolicyForm({ initial, options }) {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = flow7Content[language]
  const p = t.admin.policies
  const [form, setForm] = useState({
    ...initial,
    keyRotationDays: String(initial.keyRotationDays),
    backupRetentionDays: String(initial.backupRetentionDays),
    dmsDefaultIntervalDays: String(initial.dmsDefaultIntervalDays ?? 30),
    dmsDefaultGraceDays: String(initial.dmsDefaultGraceDays ?? 14),
    dmsMaxReminders: String(initial.dmsMaxReminders ?? 3),
  })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }))

  const rotation = Number(form.keyRotationDays)
  const retention = Number(form.backupRetentionDays)
  const dmsInterval = Number(form.dmsDefaultIntervalDays)
  const dmsGrace = Number(form.dmsDefaultGraceDays)
  const dmsReminders = Number(form.dmsMaxReminders)

  const rotationError = Number.isInteger(rotation) && rotation >= 7 && rotation <= 365 ? null : p.rotationHint
  const retentionError = Number.isInteger(retention) && retention >= 1 && retention <= 3650 ? null : p.retentionHint
  const dmsIntervalError = Number.isInteger(dmsInterval) && dmsInterval >= 7 && dmsInterval <= 365 ? null : p.dmsIntervalHint
  const dmsGraceError = Number.isInteger(dmsGrace) && dmsGrace >= 1 && dmsGrace <= 90 ? null : p.dmsGraceHint
  const dmsRemindersError = Number.isInteger(dmsReminders) && dmsReminders >= 1 && dmsReminders <= 10 ? null : p.dmsRemindersHint

  const submit = async (event) => {
    event.preventDefault()
    if (rotationError || retentionError || dmsIntervalError || dmsGraceError || dmsRemindersError) {
      setMessage({ tone: 'error', text: p.invalid })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      await savePolicies(user, {
        ...form,
        keyRotationDays: rotation,
        backupRetentionDays: retention,
        dmsDefaultIntervalDays: dmsInterval,
        dmsDefaultGraceDays: dmsGrace,
        dmsMaxReminders: dmsReminders,
      })
      setMessage({ tone: 'success', text: t.saved })
    } catch (err) {
      setMessage({ tone: 'error', text: flow7ErrorText(t, err) })
    } finally {
      setBusy(false)
    }
  }

  const toOptions = (list, labels) => list.map((value) => ({ value, label: labels?.[value] ?? value }))

  return (
    <form className="admin-policy-grid" onSubmit={submit} noValidate>
      <section className="card handover-panel">
        <h2 className="section-title">{p.encryption}</h2>
        <FormField id="pol-alg" as="select" label={p.algorithm} value={form.encryptionAlgorithm}
          options={toOptions(options.encryptionAlgorithm)} onChange={(e) => set('encryptionAlgorithm', e.target.value)} />
        <FormField id="pol-rot" type="number" min={7} max={365} label={p.rotation} hint={p.rotationHint}
          value={form.keyRotationDays} error={rotationError && message?.tone === 'error' ? rotationError : undefined}
          onChange={(e) => set('keyRotationDays', e.target.value)} />
        <label className="handover-check">
          <input type="checkbox" checked={form.requireClientSideEncryption}
            onChange={(e) => set('requireClientSideEncryption', e.target.checked)} />
          <span>{p.clientSide}</span>
        </label>
        {!form.requireClientSideEncryption && <p className="handover-note handover-note--danger">{p.weakWarning}</p>}
      </section>

      <section className="card handover-panel">
        <h2 className="section-title">{p.backup}</h2>
        <FormField id="pol-freq" as="select" label={p.frequency} value={form.backupFrequency}
          options={toOptions(options.backupFrequency, p.frequencies)} onChange={(e) => set('backupFrequency', e.target.value)} />
        <FormField id="pol-ret" type="number" min={1} max={3650} label={p.retention} hint={p.retentionHint}
          value={form.backupRetentionDays} error={retentionError && message?.tone === 'error' ? retentionError : undefined}
          onChange={(e) => set('backupRetentionDays', e.target.value)} />
        <FormField id="pol-region" as="select" label={p.region} value={form.backupRegion}
          options={toOptions(options.backupRegion)} onChange={(e) => set('backupRegion', e.target.value)} />
      </section>

      <section className="card handover-panel" style={{ gridColumn: '1 / -1' }}>
        <h2 className="section-title">{p.dms}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <FormField id="pol-dms-int" type="number" min={7} max={365} label={p.dmsInterval} hint={p.dmsIntervalHint}
            value={form.dmsDefaultIntervalDays} error={dmsIntervalError && message?.tone === 'error' ? dmsIntervalError : undefined}
            onChange={(e) => set('dmsDefaultIntervalDays', e.target.value)} />
          <FormField id="pol-dms-grace" type="number" min={1} max={90} label={p.dmsGrace} hint={p.dmsGraceHint}
            value={form.dmsDefaultGraceDays} error={dmsGraceError && message?.tone === 'error' ? dmsGraceError : undefined}
            onChange={(e) => set('dmsDefaultGraceDays', e.target.value)} />
          <FormField id="pol-dms-rem" type="number" min={1} max={10} label={p.dmsReminders} hint={p.dmsRemindersHint}
            value={form.dmsMaxReminders} error={dmsRemindersError && message?.tone === 'error' ? dmsRemindersError : undefined}
            onChange={(e) => set('dmsMaxReminders', e.target.value)} />
        </div>
      </section>

      <div className="admin-policy-actions">
        {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}
        <Button type="submit" disabled={busy}>{busy ? t.saving : t.save}</Button>
      </div>
    </form>
  )
}
