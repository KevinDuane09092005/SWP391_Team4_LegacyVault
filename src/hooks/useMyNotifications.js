import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { NOTIFICATIONS_CHANGED, listMyNotifications } from '../services/notificationService.js'

// Flow 7 — Keeps the signed-in user's notifications fresh when any flow adds or reads one.
export default function useMyNotifications() {
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading', items: [], error: null })

  const reload = useCallback(() => {
    if (!user) return
    listMyNotifications(user).then(
      (items) => setState({ status: 'ready', items, error: null }),
      (error) => setState((prev) => ({ ...prev, status: 'error', error })),
    )
  }, [user])

  useEffect(() => {
    reload()
    const onStorage = (event) => {
      if (!event.key || event.key.includes('notifications')) reload()
    }
    window.addEventListener(NOTIFICATIONS_CHANGED, reload)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED, reload)
      window.removeEventListener('storage', onStorage)
    }
  }, [reload])

  return { ...state, reload }
}
