// Unified API Client for LegacyVault Backend API Integration (Flows 1-7).

const getEnvBase = () => {
  try {
    return (
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.REACT_APP_API_BASE_URL ||
      ''
    ).replace(/\/$/, '')
  } catch {
    return ''
  }
}

let forcedDemoMode = null
let overrideAuthToken = null

export function setDemoMode(val) {
  forcedDemoMode = val
}

export function setAuthToken(token) {
  overrideAuthToken = token
}

const getIsDemo = () => {
  if (forcedDemoMode !== null) return forcedDemoMode
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_DEMO_MODE === 'false') return false
      if (import.meta.env.VITE_DEMO_MODE === 'true') return true
    }
  } catch {
    // ignore
  }
  return typeof window === 'undefined'
}

export function isDemoMode() {
  return getIsDemo()
}

export const IS_DEMO_MODE = getIsDemo()

export function getBaseUrl() {
  const base = getEnvBase()
  return base.endsWith('/api/v1') ? base.replace(/\/api\/v1$/, '') : base
}

export function normalizeApiPath(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const clean = path.startsWith('/') ? path : `/${path}`
  const withVersion = clean.startsWith('/api/v1')
    ? clean
    : (clean.startsWith('/api/') ? clean.replace(/^\/api\//, '/api/v1/') : `/api/v1${clean}`)

  let base = getBaseUrl()
  if (!base && typeof window === 'undefined') {
    base = 'http://localhost:8080'
  }
  return base ? `${base}${withVersion}` : withVersion
}

export function getAuthToken() {
  if (overrideAuthToken) return overrideAuthToken
  try {
    if (typeof localStorage !== 'undefined') {
      const direct =
        localStorage.getItem('token') ||
        localStorage.getItem('legacyvault-access-token')
      if (direct) return direct

      if (typeof sessionStorage !== 'undefined') {
        const sessionDirect =
          sessionStorage.getItem('token') ||
          sessionStorage.getItem('legacyvault-access-token')
        if (sessionDirect) return sessionDirect
      }

      const raw =
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('legacyvault.session')) ||
        localStorage.getItem('legacyvault.session')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.token) return parsed.token
        if (parsed?.user?.token) return parsed.user.token
      }
    }
  } catch {
    return null
  }
  return null
}

export function getAuthHeaders(isMultipart = false) {
  const token = getAuthToken()
  return {
    ...(!isMultipart ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function apiFetch(path, options = {}) {
  const endpoint = normalizeApiPath(path)
  const isMultipart = options.body instanceof FormData
  const headers = {
    ...getAuthHeaders(isMultipart),
    ...options.headers,
  }

  let body = options.body
  if (body !== undefined && !isMultipart && typeof body === 'object' && !(body instanceof Blob)) {
    body = JSON.stringify(body)
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    ...(body !== undefined ? { body } : {}),
  })

  if (!response.ok) {
    let details
    try {
      details = await response.json()
    } catch {
      // non-JSON
    }
    const error = new Error(
      details?.message || details?.error || `Request failed (${response.status})`
    )
    error.status = response.status
    error.data = details
    throw error
  }

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  if (
    contentType.includes('text/csv') ||
    contentType.includes('application/octet-stream') ||
    contentType.includes('application/pdf')
  ) {
    return response.blob()
  }
  return response.text()
}

export function downloadBlob(blob, filename) {
  if (typeof window === 'undefined') return
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
