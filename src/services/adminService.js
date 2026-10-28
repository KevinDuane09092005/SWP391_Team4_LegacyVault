import {
  mockAdminGetPermissions,
  mockAdminGetPolicies,
  mockAdminListIntegrations,
  mockAdminListUsers,
  mockAdminResetDemo,
  mockAdminSavePolicies,
  mockAdminSetIntegration,
  mockAdminSetPermission,
  mockAdminSetUserRole,
  mockAdminSetUserStatus,
} from '../mocks/mockAdminStore.js'
import { IS_DEMO_MODE, apiFetch } from './apiClient.js'

export { IS_DEMO_MODE }

// 1. GET /admin/dashboard
export async function getAdminDashboardApi() {
  if (IS_DEMO_MODE) {
    const users = await mockAdminListUsers()
    return {
      metrics: {
        total_users: users.length,
        pending_requests: 3,
        notifications_sent: 156,
        audit_events: 1247,
      },
      users: users.map((u) => ({
        id: u.id,
        user_id: u.id,
        fullName: u.fullName || u.name,
        name: u.fullName || u.name,
        identifier: u.email || u.identifier,
        email: u.email || u.identifier,
        role: u.role,
        status: u.status,
      })),
      access_requests: [
        {
          request_id: 'req-001',
          user_name: 'Anthony Walker',
          requested_role: 'DIGITAL_EXECUTOR',
          case_id: 'LV-1042',
          requested_date: '24 Sep 2026',
          status: 'PENDING',
        },
      ],
      roles_summary: [],
      system_settings: [],
    }
  }

  const data = await apiFetch('/admin/dashboard')
  const rawUsers = data.user_management_preview || data.users || []
  return {
    ...data,
    metrics: data.metrics || {
      total_users: data.kpi_metrics?.total_users ?? rawUsers.length,
      pending_requests: data.kpi_metrics?.pending_requests ?? 0,
      notifications_sent: data.kpi_metrics?.notifications_sent ?? 0,
      audit_events: data.kpi_metrics?.audit_events ?? 0,
    },
    users: rawUsers.map((u, i) => ({
      id: u.user_id || u.id || `u-${i + 1}`,
      user_id: u.user_id || u.id || `u-${i + 1}`,
      fullName: u.name || u.fullName || 'User',
      name: u.name || u.fullName || 'User',
      identifier:
        u.email ||
        u.identifier ||
        `${(u.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '.')}@legacyvault.demo`,
      email: u.email || u.identifier,
      role: u.role?.toUpperCase() || 'VAULT_OWNER',
      status: u.status?.toUpperCase() || 'ACTIVE',
      created_date_formatted: u.created_date_formatted,
    })),
    access_requests: (data.access_requests_queue || data.access_requests || []).map((request) => ({
      ...request,
      request_id: request.request_id || request.requestId,
      user_name: request.requester_name || request.user_name || request.userName || 'User',
      requested_role: request.requested_role_or_purpose || request.requested_role || request.requestedRole || '',
      status: request.status || 'PENDING',
    })),
    roles_summary: data.roles_and_permissions_summary || data.roles_summary || [],
    system_settings: data.system_settings_modules || data.system_settings || [],
  }
}

// 2. POST /admin/access-requests/{requestId}/approve
export async function approveAccessRequestApi(requestId) {
  if (IS_DEMO_MODE) {
    return { success: true, request_id: requestId, status: 'APPROVED' }
  }
  return apiFetch(`/admin/access-requests/${encodeURIComponent(requestId)}/approve`, {
    method: 'POST',
  })
}

// 3. POST /admin/access-requests/{requestId}/reject
export async function rejectAccessRequestApi(requestId) {
  if (IS_DEMO_MODE) {
    return { success: true, request_id: requestId, status: 'REJECTED' }
  }
  return apiFetch(`/admin/access-requests/${encodeURIComponent(requestId)}/reject`, {
    method: 'POST',
  })
}

// ---------------- Existing Page Wrapper Methods ----------------

function normalizeAdminUser(user) {
  return {
    id: String(user.id || user.user_id || ''),
    user_id: String(user.id || user.user_id || ''),
    fullName: user.fullName || user.full_name || user.name || 'User',
    name: user.fullName || user.full_name || user.name || 'User',
    identifier: user.identifier || user.email || '',
    email: user.email || user.identifier || '',
    role: String(user.role || 'VAULT_OWNER').toUpperCase(),
    status: String(user.status || 'ACTIVE').toUpperCase(),
    createdAt: user.createdAt || user.created_at || null,
    created_date_formatted: user.createdAt || user.created_at || null,
  }
}

export async function listUsers(user, filters = {}) {
  if (IS_DEMO_MODE) return mockAdminListUsers(user)

  const params = new URLSearchParams({
    search: filters.search || '',
    role: filters.role || 'ALL',
    status: filters.status || 'ALL',
    page: '0',
    size: '100',
  })
  const firstPage = await apiFetch(`/admin/users?${params}`)
  const users = firstPage.users || []
  const totalPages = firstPage.pagination?.totalPages ?? firstPage.pagination?.total_pages ?? 1

  if (totalPages > 1) {
    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => {
        params.set('page', String(index + 1))
        return apiFetch(`/admin/users?${params}`)
      }),
    )
    users.push(...remainingPages.flatMap((page) => page.users || []))
  }

  return users.map(normalizeAdminUser)
}

export async function setUserStatus(user, userId, status) {
  if (IS_DEMO_MODE) return mockAdminSetUserStatus(user, userId, status)
  return apiFetch(`/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export async function setUserRole(user, userId, role) {
  if (IS_DEMO_MODE) return mockAdminSetUserRole(user, userId, role)
  return apiFetch(`/admin/users/${encodeURIComponent(userId)}/role`, {
    method: 'PATCH',
    body: { role },
  })
}
export const getPermissions = (user) => mockAdminGetPermissions(user)
export const setPermission = (user, role, permission, granted) =>
  mockAdminSetPermission(user, role, permission, granted)
export const getPolicies = (user) => mockAdminGetPolicies(user)
export const savePolicies = (user, policies) => mockAdminSavePolicies(user, policies)
export const listIntegrations = (user) => mockAdminListIntegrations(user)
export const setIntegration = (user, id, enabled) =>
  mockAdminSetIntegration(user, id, enabled)
export const resetAllDemoData = (user) => mockAdminResetDemo(user)
