import { isKnownRole, normalizeRole } from './roles.js'

// Remembers who is signed in, so a page refresh keeps the user signed in.
//
// DEMO LIMITATION — read before presenting:
// - This is plain browser storage. Anyone can edit it in DevTools and change their role,
//   so it is NOT security. It only decides which screen the frontend shows.
// - The backend checks the user and role on every protected request.
// - This prototype stores the backend JWT in browser storage for API calls; production
//   should prefer a server-managed, httpOnly secure cookie.
// - Passwords and OTP codes are never written to the signed-in session.
//
// "Keep me signed in" → localStorage (survives closing the browser).
// Otherwise           → sessionStorage (this browser tab only).

const SESSION_KEY = 'legacyvault.session'
const PENDING_KEY = 'legacyvault.pendingVerification'
const AUTH_KEYS = ['legacyvault-access-token', 'token', 'role', 'userId']

function safely(action, fallback = null) {
  try {
    return action()
  } catch {
    // Storage can be blocked (private mode, disabled cookies).
    return fallback
  }
}

function syncLegacyTokenStorage(session) {
  safely(() => {
    if (session?.token) {
      window.localStorage.setItem('token', session.token)
      window.localStorage.setItem('legacyvault-access-token', session.token)
      if (session.user?.role) {
        window.localStorage.setItem('role', session.user.role)
      }
      if (session.user?.id) {
        window.localStorage.setItem('userId', session.user.id)
      }
    }
  })
}

export function saveSession(user, remember, token) {
  const authToken = token || user?.token || null
  const normalizedRole = normalizeRole(user?.role)
  const session = {
    user: {
      id: user.id,
      fullName: user.fullName,
      identifier: user.identifier,
      role: normalizedRole,
      availableContexts: Array.isArray(user.availableContexts) ? user.availableContexts : [],
      activeContext: user.activeContext || null,
    },
    token: authToken,
    remember: Boolean(remember),
    mode: authToken ? 'backend' : 'demo',
    signedInAt: new Date().toISOString(),
  }
  clearSession()
  const storage = remember ? window.localStorage : window.sessionStorage
  safely(() => storage.setItem(SESSION_KEY, JSON.stringify(session)))
  syncLegacyTokenStorage(session)
  return session
}

// Returns the saved session, or null if there is none or it looks broken.
export function readSession() {
  return safely(() => {
    const raw =
      window.sessionStorage.getItem(SESSION_KEY) ?? window.localStorage.getItem(SESSION_KEY)
    if (!raw) {
      clearSession()
      return null
    }
    const session = JSON.parse(raw)
    if (session?.user?.id && isKnownRole(session.user.role)) {
      session.user.role = normalizeRole(session.user.role)
      syncLegacyTokenStorage(session)
      return session
    }
    clearSession()
    return null
  })
}

export function clearSession() {
  safely(() => {
    for (const storage of [window.sessionStorage, window.localStorage]) {
      storage.removeItem(SESSION_KEY)
      AUTH_KEYS.forEach((key) => storage.removeItem(key))
    }
  })
}

export function isSessionKey(key) {
  return key === SESSION_KEY
}

// Who is waiting to enter an OTP after registering (name + email/phone only).
export function savePendingVerification({ identifier, fullName, userId, testOtp, planId, billing }) {
  safely(() =>
    window.sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ identifier, fullName, userId, testOtp, planId, billing }),
    ),
  )
}

export function readPendingVerification() {
  return safely(() => JSON.parse(window.sessionStorage.getItem(PENDING_KEY)))
}

export function clearPendingVerification() {
  safely(() => window.sessionStorage.removeItem(PENDING_KEY))
}
