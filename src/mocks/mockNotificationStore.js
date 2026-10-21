import { AdminError } from '../admin/AdminError.js'
import { createDemoStorage } from './demoStorage.js'
import { seedNotifications } from './mockFlow7Seeds.js'

// DEMO ONLY — in-app Notification Service (Flow 7).
// System events call pushNotification(); each notification belongs to exactly one user,
// and a user can only list or change their own. No e-mail, SMS or push message is sent.

const storage = createDemoStorage('legacyvault-demo-notifications')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const copy = (value) => structuredClone(value)

// Screens listen for this to refresh the bell (same tab). Other tabs get the `storage` event.
export const NOTIFICATIONS_CHANGED = 'legacyvault:notifications-changed'

function announce() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
}

// Seed notifications are added once; after that the saved copy (with its read flags) wins.
function load() {
  const items = storage.get()?.items ?? []
  const known = new Set(items.map((item) => item.id))
  return { items: [...items, ...copy(seedNotifications.filter((item) => !known.has(item.id)))] }
}

function save(state) {
  storage.set(state)
  announce()
}

function requireUser(user) {
  if (!user) throw new AdminError('NOT_SIGNED_IN')
}

const newest = (a, b) => b.createdAt.localeCompare(a.createdAt)

// Called by the mock services when a system event concerns `userId`.
export function pushNotification({ userId, type, params = {}, caseId = null }) {
  const state = load()
  const item = {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    type,
    params,
    caseId,
    createdAt: new Date().toISOString(),
    read: false,
  }
  state.items.unshift(item)
  save(state)
  return item
}

export async function mockListMyNotifications(user) {
  await delay(150)
  requireUser(user)
  return copy(load().items.filter((item) => item.userId === user.id).sort(newest))
}

export async function mockMarkNotificationRead(user, id) {
  requireUser(user)
  const state = load()
  const item = state.items.find((entry) => entry.id === id)
  // Someone else's notification looks the same as a missing one.
  if (!item || item.userId !== user.id) throw new AdminError('NOT_FOUND')
  item.read = true
  save(state)
}

export async function mockMarkAllNotificationsRead(user) {
  requireUser(user)
  const state = load()
  let changed = false
  for (const item of state.items) {
    if (item.userId === user.id && !item.read) {
      item.read = true
      changed = true
    }
  }
  if (changed) save(state)
}

// Handover demo reset: drop every handover notification; the seeded ones come back unread-as-seeded.
export function clearCaseNotifications() {
  save({ items: load().items.filter((item) => !item.caseId) })
}

export function resetNotifications() {
  storage.clear()
  announce()
}
