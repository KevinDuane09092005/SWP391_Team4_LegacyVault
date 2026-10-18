// UI-only state derivation. The Backend scheduler owns authoritative triggers and notifications.
export function computeDmsView({
  configured,
  now,
  nextCheckIn,
  graceEndsAt,
  backendStatus,
  apiError = '',
}) {
  if (apiError) return 'error'
  if (!configured) return 'config'

  const status = backendStatus?.toLowerCase()
  if (status === 'triggered') return 'triggered'
  if (status === 'grace_period' || status === 'warning') return 'warning'
  if (status === 'due_soon') return 'soon'
  if (status === 'active') {
    if (nextCheckIn) {
      const due = new Date(nextCheckIn).getTime()
      if (Number.isFinite(due) && due - now <= 3 * 86400000 && due > now) {
        return 'soon'
      }
    }
    return 'active'
  }

  // Fallback to time-based calculation if backendStatus is not set
  const due = new Date(nextCheckIn).getTime()
  const end = new Date(graceEndsAt).getTime()
  if (!Number.isFinite(due) || !Number.isFinite(end)) return 'active'
  if (now >= end) return 'triggered'
  if (now >= due) return 'warning'
  if (due - now <= 3 * 86400000) return 'soon'
  return 'active'
}

export function futureDate(lastCheckIn, intervalDays) {
  return new Date(new Date(lastCheckIn).getTime() + intervalDays * 86400000)
}

export function dateLabel(value, locale = 'en-US') {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCountdown(ms) {
  const t = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(t / 86400)
  const h = Math.floor((t % 86400) / 3600)
  const m = Math.floor((t % 3600) / 60)
  const sec = t % 60
  return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
