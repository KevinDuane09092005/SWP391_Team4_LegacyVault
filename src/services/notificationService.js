import {
  NOTIFICATIONS_CHANGED,
  mockListMyNotifications,
  mockMarkAllNotificationsRead,
  mockMarkNotificationRead,
} from '../mocks/mockNotificationStore.js'
import { IS_DEMO_MODE, apiFetch } from './apiClient.js'

export { IS_DEMO_MODE, NOTIFICATIONS_CHANGED }

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
      })),
      unread_count: items.filter((n) => !n.read).length,
    }
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return apiFetch(`/notifications?${params}`)
}

// 2. POST /notifications/mark-all-read
export async function markAllNotificationsReadApi() {
  if (IS_DEMO_MODE) {
    return mockMarkAllNotificationsRead()
  }
  return apiFetch('/notifications/mark-all-read', {
    method: 'POST',
  })
}

// 3. GET /notifications/{notificationId}
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
  return (data?.notifications || []).map((n) => ({
    id: n.notification_id,
    type: n.badge_label || 'INFO',
    title: n.title,
    text: n.subtext,
    createdAt: n.timestamp_formatted,
    read: Boolean(n.is_read ?? n.read),
  }))
}

export const markNotificationRead = async (user, id) => {
  if (IS_DEMO_MODE) return mockMarkNotificationRead(user, id)
  // Backend marks as read on detail view or specific action
  return { success: true }
}

export const markAllNotificationsRead = async (user) => {
  if (IS_DEMO_MODE) return mockMarkAllNotificationsRead(user)
  return markAllNotificationsReadApi()
}
