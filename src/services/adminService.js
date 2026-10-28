import { AdminError } from '../admin/AdminError.js'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.REACT_APP_API_BASE_URL ||
  ''
).replace(/\/$/, '')

function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE_URL) return `/api/v1${normalizedPath}`
  if (API_BASE_URL.endsWith('/api/v1')) return `${API_BASE_URL}${normalizedPath}`
  return `${API_BASE_URL}/api/v1${normalizedPath}`
}

function readToken() {
  try {
    return window.localStorage.getItem('legacyvault-access-token')
      || window.localStorage.getItem('token')
      || window.sessionStorage.getItem('legacyvault-access-token')
      || window.sessionStorage.getItem('token')
  } catch {
    return null
  }
}

function apiError(response, body) {
  const message = body?.error || body?.message || ''
  let code = 'GENERIC'
  if (response.status === 401) code = 'NOT_SIGNED_IN'
  else if (response.status === 403) code = 'ADMIN_ONLY'
  else if (response.status === 404) code = 'NOT_FOUND'
  else if (response.status === 409 && /own account/i.test(message)) code = 'SELF_CHANGE'
  else if (response.status === 409) code = 'CONFLICT'
  else if (response.status === 400 || response.status === 422) code = 'INVALID_INPUT'
  return new AdminError(code, { status: response.status, message })
}

async function request(path, { method = 'GET', body, responseType = 'json' } = {}) {
  const token = readToken()
  if (!token) throw new AdminError('NOT_SIGNED_IN')

  const headers = { Authorization: `Bearer ${token}` }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new AdminError('NETWORK')
  }

  if (responseType === 'blob') {
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw apiError(response, errorBody)
    }
    return response.blob()
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw apiError(response, data)
  return data
}

function query(params = {}) {
  const values = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      values.set(key, String(value))
    }
  })
  const suffix = values.toString()
  return suffix ? `?${suffix}` : ''
}

function normalizeRole(role) {
  const normalized = String(role ?? '').toUpperCase()
  return normalized === 'DIGITAL_EXECUTOR' ? 'EXECUTOR' : normalized
}

export const IS_DEMO_MODE = false

export async function getAdminUsersPage(filters = {}) {
  const params = query({
    search: filters.search,
    role: filters.role,
    status: filters.status,
    page: filters.page ?? 0,
    size: filters.size ?? 100,
  })
  const result = await request(`/admin/users${params}`)
  return {
    ...result,
    users: (result.users ?? []).map((user) => ({
      id: user.id ?? user.user_id,
      fullName: user.fullName ?? user.name ?? user.identifier ?? user.email ?? '—',
      identifier: user.identifier ?? user.email ?? '—',
      role: normalizeRole(user.role),
      status: String(user.status ?? 'ACTIVE').toUpperCase(),
    })),
  }
}

export async function listUsers(_user, filters = {}) {
  const result = await getAdminUsersPage(filters)
  return result.users
}

export function setUserStatus(_user, userId, status) {
  return request(`/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export function setUserRole(_user, userId, role) {
  return request(`/admin/users/${encodeURIComponent(userId)}/role`, {
    method: 'PATCH',
    body: { role },
  })
}

export function getAdminDashboard() {
  return request('/admin/dashboard')
}

function mapAuditRow(row, index) {
  const status = String(row.status ?? '').toUpperCase()
  const outcome = status === 'SUCCESS' ? 'SUCCESS' : status === 'DENIED' ? 'DENIED' : 'FAILURE'
  return {
    id: `${row.time_formatted ?? 'audit'}-${index}`,
    at: row.time_formatted ?? '',
    timeFormatted: row.time_formatted ?? '',
    actor: { name: row.user || '—' },
    action: row.action || 'UNKNOWN',
    entity: row.target ? { type: '', id: row.target } : null,
    outcome,
    severity: outcome === 'SUCCESS' ? 'INFO' : 'WARNING',
    details: row.ip_address ? { ip: row.ip_address } : {},
  }
}

export async function listAuditLog(_user, filters = {}) {
  const params = query({
    search: filters.actor,
    action: filters.action,
    from_date: filters.from,
    to_date: filters.to,
    page: filters.page ?? 0,
    size: filters.size ?? 100,
  })
  const result = await request(`/admin/audit-logs${params}`)
  let entries = (result.logs ?? []).map(mapAuditRow)

  if (filters.outcome) entries = entries.filter((entry) => entry.outcome === filters.outcome)
  if (filters.alertsOnly) entries = entries.filter((entry) => entry.outcome !== 'SUCCESS')
  return entries
}

export function approveAccessRequest(requestId) {
  return request(`/admin/access-requests/${encodeURIComponent(requestId)}/approve`, { method: 'POST' })
}

export function rejectAccessRequest(requestId) {
  return request(`/admin/access-requests/${encodeURIComponent(requestId)}/reject`, { method: 'POST' })
}
