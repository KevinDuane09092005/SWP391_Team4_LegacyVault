import { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/authService.js'
import { recordSignIn, recordSignOut } from '../services/auditService.js'
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

  // Called by the sign-in page once it has shown "You have been signed out".
  const markLogoutSeen = () => setJustLoggedOut(false)

  const setSessionUser = (user, remember, token) => {
    const newSession = saveSession(user, remember, token)
    setSession(newSession)
    setJustLoggedOut(false)
    return newSession
  }

  const value = { user: session?.user ?? null, session, justLoggedOut, login, logout, markLogoutSeen, setSessionUser }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
