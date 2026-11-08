import {
  NOTIFICATIONS_CHANGED,
  mockListMyNotifications,
  mockMarkAllNotificationsRead,
  mockMarkNotificationRead,
} from '../mocks/mockNotificationStore.js'
import { IS_DEMO_MODE, apiFetch } from './apiClient.js'

export { IS_DEMO_MODE, NOTIFICATIONS_CHANGED }

export function extractCaseId(text) {
  if (!text || typeof text !== 'string') return null
  const match = text.match(/(?:case|Case)\s*(?:#|:\s*#?|\s+)\s*([A-Za-z0-9]+(?:-[A-Za-z0-9]+)?)/)
  return match ? match[1] : null
}

// 1. GET /notifications
export async function getNotificationsApi({ page = 0, size = 10 } = {}) {
  if (IS_DEMO_MODE) {
    const items = await mockListMyNotifications()
    const start = page * size
    const paged = items.slice(start, start + size)
    return {
      notifications: paged.map((n) => ({
        notification_id: n.id,
        title: n.title || n.type || 'System Event',
        subtext: n.text || n.params?.text || 'Notification update',
        timestamp_formatted: n.createdAt || new Date().toISOString(),
        badge_label: n.type?.includes('APPROVED') ? 'Approved' : 'Info',
        is_read: Boolean(n.read),
        case_id: n.caseId || null,
        deep_link: n.caseId ? `/handover/${encodeURIComponent(n.caseId)}` : null,
      })),
      unread_count: items.filter((n) => !n.read).length,
    }
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return apiFetch(`/notifications?${params}`)
}

// 2. PATCH or POST /notifications/{notificationId}/read
export async function markNotificationReadApi(notificationId) {
  if (IS_DEMO_MODE) {
    return mockMarkNotificationRead(null, notificationId)
  }
  return apiFetch(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
  })
}

// 3. POST /notifications/mark-all-read
export async function markAllNotificationsReadApi() {
  if (IS_DEMO_MODE) {
    return mockMarkAllNotificationsRead()
  }
  return apiFetch('/notifications/mark-all-read', {
    method: 'POST',
  })
}

// 4. GET /notifications/{notificationId}
export async function getNotificationDetailApi(notificationId) {
  if (IS_DEMO_MODE) {
    const list = await mockListMyNotifications()
    const item = list.find((n) => n.id === notificationId) || list[0]
    return {
      notification_id: notificationId,
      title: item?.title || 'Legal Verification Approved',
      badge_label: 'Approved',
      action_required_details:
        'The legal verification has been reviewed and approved. Documentation is verified and ready for handover release.',
      event_metadata: {
        case_id: item?.caseId || 'Case #LV-1042',
        related_user: 'Thanh Pham',
        event_time: '24 Sep 2026, 11:45 AM',
        event_type: 'Legal Verification',
        authority: 'Attorney Notary',
      },
      related_activity_timeline: [
        {
          stage_title: 'Legal Verification Approved',
          description: 'Verification request submitted with death certificate reviewed & approved',
          timestamp_formatted: '24 Sep 2026, 11:45 AM',
        },
      ],
    }
  }
  return apiFetch(`/notifications/${encodeURIComponent(notificationId)}`)
}

// ---------------- Existing Page Wrapper Methods ----------------

export const listMyNotifications = async (user) => {
  if (IS_DEMO_MODE) return mockListMyNotifications(user)
  const data = await getNotificationsApi()
  return (data?.notifications || []).map((n) => {
    const caseId =
      n.case_id ||
      n.caseId ||
      extractCaseId(n.deep_link) ||
      extractCaseId(n.deepLink) ||
      extractCaseId(n.title) ||
      extractCaseId(n.subtext)
    return {
      id: n.notification_id || n.id,
      type: n.event_type || n.eventType || n.badge_label || 'INFO',
      eventType: n.event_type || n.eventType || null,
      badgeLabel: n.badge_label || n.badgeLabel || null,
      title: n.title,
      text: n.subtext || n.content,
      createdAt: n.timestamp_formatted || n.timestampFormatted || n.created_at,
      read: Boolean(n.is_read ?? n.isRead ?? n.read),
      caseId: caseId || undefined,
      deepLink: n.deep_link || n.deepLink || (caseId ? `/handover/${encodeURIComponent(caseId)}` : undefined),
    }
  })
}

export const markNotificationRead = async (user, id) => {
  if (IS_DEMO_MODE) return mockMarkNotificationRead(user, id)
  const res = await markNotificationReadApi(id)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
  }
  return res
}

export const markAllNotificationsRead = async (user) => {
  if (IS_DEMO_MODE) return mockMarkAllNotificationsRead(user)
  const res = await markAllNotificationsReadApi()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
  }
  return res
}
