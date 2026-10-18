// Small display helpers for the vault screens.

export function formatDate(isoDate, language) {
  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate))
}

// Shows a stored option value with its translated label (e.g. 'FACEBOOK' → 'Facebook').
export function formatFieldValue(field, value, content) {
  if (!value) return content.empty
  if (field.kind === 'select') return content.options[field.name]?.[value] ?? value
  return value
}

// Formats ISO date to DD/MM/YYYY
export function formatDisplayDate(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return isoDate
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// Formats ISO date to DD/MM/YYYY HH:mm
export function formatDisplayDateTime(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return isoDate
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

