import { isKnownRole } from './roles.js'

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

export function saveSession(user, remember) {
  const session = {
    user: { id: user.id, fullName: user.fullName, identifier: user.identifier, role: user.role },
    token: user.token || null,
    remember: Boolean(remember),
    mode: user.token ? 'backend' : 'demo',
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
      syncLegacyTokenStorage(session)
      return session
    }
    clearSession()
    return null
  })
}

export function clearSession() {
  safely(() => {
    window.sessionStorage.removeItem(SESSION_KEY)
    window.localStorage.removeItem(SESSION_KEY)
    for (const key of ['token', 'legacyvault-access-token', 'role', 'userId']) {
      window.sessionStorage.removeItem(key)
      window.localStorage.removeItem(key)
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
