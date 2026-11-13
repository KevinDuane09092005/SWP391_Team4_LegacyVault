import { Navigate, useLocation } from 'react-router-dom'
import AccessDeniedPage from '../pages/dashboard/AccessDeniedPage.jsx'
import { useAuth } from './AuthContext.jsx'
import { getDashboardPath } from './roles.js'

// Route guards decide which screen to show. They are NOT security:
// the backend must still check the user and role on every request (RBAC).

// Pages that need a signed-in user. With `allowedRoles`, other roles see Access Denied.
export function RequireAuth({ allowedRoles, children }) {
  const { user, justLoggedOut, sessionEnd } = useAuth()
  const location = useLocation()

  if (!user) {
    // After Log out: plain sign-in page with a "signed out" notice.
    // Otherwise remember where the user wanted to go, to send them there after sign-in.
    const state = justLoggedOut
      ? { loggedOut: true }
      : { ...(sessionEnd ?? {}), from: sessionEnd?.from ?? location.pathname }
    return <Navigate to="/login" replace state={state} />
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <AccessDeniedPage />
  }
  return children
}

// Sign in / register / OTP pages: a signed-in user goes to their dashboard instead
// (or back to the page they were trying to open before signing in).
export function RedirectIfSignedIn({ children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (user) {
    return <Navigate to={location.state?.from ?? getDashboardPath(user.role)} replace />
  }
  return children
}

// /dashboard sends each user to their own role's dashboard.
export function DashboardRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? getDashboardPath(user.role) : '/login'} replace />
}
