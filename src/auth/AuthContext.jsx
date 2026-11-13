import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as authService from '../services/authService.js'
import { recordSignIn, recordSignOut } from '../services/auditService.js'
import { normalizeRole } from './roles.js'
import { clearSession, isSessionKey, readSession, saveSession } from './session.js'

// Holds "who is signed in" for the whole app.
// Pages read it with useAuth(); sign in / sign out also go through here so the
// saved session (session.js) and the screen always agree.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Start from the saved session so a refresh does not flash the sign-in page.
  const [session, setSession] = useState(readSession)
  // True right after the user presses Log out, so the guard can say "You have been signed out".
  const [justLoggedOut, setJustLoggedOut] = useState(false)
  // Why the session ended without a Log out click (expired token, missing backend session).
  // RequireAuth passes it to the sign-in page, which shows the message.
  const [sessionEnd, setSessionEnd] = useState(null)

  // Ask the service who is signed in (with a backend: the server). Sign out if it says no one.
  useEffect(() => {
    let cancelled = false
    authService.getCurrentUser().then((user) => {
      if (!cancelled && !user) setSession(null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Refresh dynamic role contexts from GET /api/v1/auth/contexts when signed in with backend token.
  useEffect(() => {
    let cancelled = false
    if (!session?.token || !session?.user?.id) return undefined
    authService.getAuthContexts().then((contexts) => {
      if (cancelled || !Array.isArray(contexts) || contexts.length === 0) return
      setSession((prev) => {
        if (!prev?.user) return prev
        const updatedUser = {
          ...prev.user,
          availableContexts: contexts,
          activeContext:
            prev.user.activeContext ||
            contexts.find((c) => c.role === prev.user.role) ||
            contexts[0],
        }
        return saveSession(updatedUser, prev.remember, prev.token)
      })
    })
    return () => {
      cancelled = true
    }
  }, [session?.token, session?.user?.id])

  // Signing in or out in another tab updates this tab too.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === null || isSessionKey(event.key)) setSession(readSession())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = async ({ identifier, password, remember }) => {
    let result
    try {
      result = await authService.login({ identifier, password })
    } catch (error) {
      // Flow 7 audit: the outcome and the typed identifier only, never the password.
      recordSignIn({ identifier, success: false, reason: error?.code })
      throw error
    }
    const { user, token } = result
    recordSignIn({ user, identifier, success: true })
    setSession(saveSession(user, remember, token))
    setJustLoggedOut(false)
    setSessionEnd(null)
    return user
  }

  const logout = async () => {
    if (session?.user) recordSignOut(session.user)
    try {
      await authService.logout()
    } finally {
      // Clear the frontend session even if the server call fails.
      clearSession()
      setSession(null)
      setJustLoggedOut(true)
    }
  }

  // Pages call this when the backend session is missing or expired. Unlike only navigating to
  // /login, it really ends the session, so the sign-in page cannot bounce the user back (no loop).
  // `options` keeps the old navigate shape: { state: { from, message } }.
  const endSession = useCallback((options) => {
    clearSession()
    setSession(null)
    setJustLoggedOut(false)
    setSessionEnd({ sessionEnded: true, ...(options?.state ?? {}) })
  }, [])

  // Called by the sign-in page once it has shown "You have been signed out".
  const markLogoutSeen = () => setJustLoggedOut(false)

  const setSessionUser = (user, remember, token) => {
    const newSession = saveSession(user, remember, token)
    setSession(newSession)
    setJustLoggedOut(false)
    setSessionEnd(null)
    return newSession
  }

  const switchRoleContext = (contextItem) => {
    if (!session?.user || !contextItem) return null
    const nextRole = normalizeRole(contextItem.role || contextItem.roleCode)
    const updatedUser = {
      ...session.user,
      role: nextRole,
      activeContext: {
        ...contextItem,
        role: nextRole,
      },
    }
    const newSession = saveSession(updatedUser, session.remember, session.token)
    setSession(newSession)
    return newSession
  }

  const value = {
    user: session?.user ?? null,
    session,
    justLoggedOut,
    sessionEnd,
    login,
    logout,
    endSession,
    markLogoutSeen,
    setSessionUser,
    switchRoleContext,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
