// UI-only state derivation. The Backend scheduler owns authoritative triggers and notifications.

export function computeDmsView({
  configured,
  now,
  nextCheckIn,
  graceEndsAt,
  backendStatus,
  apiError = '',
  intervalMs = 60 * 1000,
}) {
  if (apiError) return 'error'
  if (!configured) return 'config'

  // Ngưỡng 'sắp đến hạn' (due soon):
  // - Nếu chu kỳ ngắn (< 3 phút như 60s thử nghiệm), cảnh báo khi còn 10 giây hoặc 1/3 chu kỳ
  // - Nếu chu kỳ bình thường (ngày/tháng), cảnh báo khi còn 3 ngày hoặc 1/3 chu kỳ
  const soonThreshold =
    intervalMs < 180000
      ? Math.min(10000, Math.max(1000, intervalMs / 3))
      : Math.min(3 * 86400000, intervalMs / 3)

  const status = backendStatus?.toLowerCase()
  if (status === 'triggered') return 'triggered'

  const due = new Date(nextCheckIn).getTime()
  const end = new Date(graceEndsAt).getTime()

  // Ưu tiên kiểm tra mốc thời gian thực khi đồng hồ đếm ngược chạm 00:00:00
  if (Number.isFinite(due) && Number.isFinite(end)) {
    if (now >= end) return 'triggered'
    if (now >= due) return 'warning'
    if (due - now <= soonThreshold) return 'soon'
  }

  if (status === 'grace_period' || status === 'warning') return 'warning'
  if (status === 'due_soon') return 'soon'
  return 'active'
}

export function futureDate(lastCheckIn, intervalSeconds) {
  return new Date(new Date(lastCheckIn).getTime() + intervalSeconds * 1000)
}

export function dateLabel(value, locale = 'en-US', includeSeconds = true) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
  })
}

export function formatCountdown(ms) {
  const t = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(t / 86400)
  const h = Math.floor((t % 86400) / 3600)
  const m = Math.floor((t % 3600) / 60)
  const sec = t % 60
  if (d > 0) {
    return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function formatTimeInterval(seconds, isVi = true) {
  const sec = Number(seconds)
  if (!Number.isFinite(sec) || sec <= 0) return isVi ? '0 giây' : '0 seconds'

  if (sec < 60) {
    return isVi ? `${sec} Giây (${sec}s)` : `${sec} Seconds (${sec}s)`
  }
  if (sec < 3600) {
    const mins = Math.floor(sec / 60)
    const rem = sec % 60
    if (rem === 0) return isVi ? `${mins} Phút (${sec}s)` : `${mins} Minutes (${sec}s)`
    return isVi ? `${mins} phút ${rem}s` : `${mins}m ${rem}s`
  }
  if (sec < 86400) {
    const hours = Math.floor(sec / 3600)
    const rem = sec % 3600
    if (rem === 0) return isVi ? `${hours} Giờ` : `${hours} Hours`
    return isVi ? `${hours} giờ ${Math.round(rem / 60)} phút` : `${hours}h ${Math.round(rem / 60)}m`
  }

  const days = Math.round(sec / 86400)
  if (days === 7) return isVi ? '7 Ngày (1 tuần)' : '7 Days (1 week)'
  if (days === 14) return isVi ? '14 Ngày (2 tuần)' : '14 Days (2 weeks)'
  if (days === 30) return isVi ? '1 Tháng (30 ngày)' : '1 Month (30 days)'
  if (days === 90) return isVi ? '3 Tháng (90 ngày)' : '3 Months (90 days)'
  if (days === 180) return isVi ? '6 Tháng (180 ngày)' : '6 Months (180 days)'
  if (days === 365) return isVi ? '1 Năm (365 ngày)' : '1 Year (365 days)'
  return isVi ? `${days} Ngày` : `${days} Days`
}
