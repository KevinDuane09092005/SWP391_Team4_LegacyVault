import {
  NOTIFICATIONS_CHANGED,
  mockListMyNotifications,
  mockMarkAllNotificationsRead,
  mockMarkNotificationRead,
} from '../mocks/mockNotificationStore.js'

// Flow 7 — Notification Service. Screens call only these functions.
// No notification backend exists yet, so everything uses the in-app demo mock in
// src/mocks/mockNotificationStore.js (no e-mail, SMS or push message is sent).

export const IS_DEMO_MODE = true
export { NOTIFICATIONS_CHANGED }

export const listMyNotifications = (user) => mockListMyNotifications(user)
export const markNotificationRead = (user, id) => mockMarkNotificationRead(user, id)
export const markAllNotificationsRead = (user) => mockMarkAllNotificationsRead(user)
