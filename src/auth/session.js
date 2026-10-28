import { isKnownRole } from './roles.js'

// Remembers who is signed in, so a page refresh keeps the user signed in.
//
// DEMO LIMITATION — read before presenting:
// - This is plain browser storage. Anyone can edit it in DevTools and change their role,
//   so it is NOT security. It only decides which screen the frontend shows.
// - The real backend must check the user and role on every request
//   (for example with an httpOnly session cookie it controls).
// - Only the public profile is stored. Passwords and OTP codes are never written here.
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

export function saveSession(user, remember, token) {
  const session = {
    user: { id: user.id, fullName: user.fullName, identifier: user.identifier, role: user.role },
    remember: Boolean(remember),
    mode: token ? 'backend' : 'demo',
    signedInAt: new Date().toISOString(),
  }
  clearSession()
  const storage = remember ? window.localStorage : window.sessionStorage
  safely(() => {
    storage.setItem(SESSION_KEY, JSON.stringify(session))
    storage.setItem('role', user.role)
    storage.setItem('userId', user.id)
    if (token) {
      storage.setItem('legacyvault-access-token', token)
      storage.setItem('token', token)
    }
  })
  return session
}

// Returns the saved session, or null if there is none or it looks broken.
export function readSession() {
  return safely(() => {
    const raw =
      window.sessionStorage.getItem(SESSION_KEY) ?? window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    return session?.user?.id && isKnownRole(session.user.role) ? session : null
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
export function savePendingVerification({ identifier, fullName }) {
  safely(() =>
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ identifier, fullName })),
  )
}

export function readPendingVerification() {
  return safely(() => JSON.parse(window.sessionStorage.getItem(PENDING_KEY)))
}

export function clearPendingVerification() {
  safely(() => window.sessionStorage.removeItem(PENDING_KEY))
}
