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
    access_requests: data.access_requests_queue || data.access_requests || [],
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

export const listUsers = (user) => {
  if (IS_DEMO_MODE) return mockAdminListUsers(user)
  return getAdminDashboardApi().then((d) => d.users || [])
}

export const setUserStatus = (user, userId, status) =>
  mockAdminSetUserStatus(user, userId, status)
export const setUserRole = (user, userId, role) =>
  mockAdminSetUserRole(user, userId, role)
export const getPermissions = (user) => mockAdminGetPermissions(user)
export const setPermission = (user, role, permission, granted) =>
  mockAdminSetPermission(user, role, permission, granted)
export const getPolicies = (user) => mockAdminGetPolicies(user)
export const savePolicies = (user, policies) => mockAdminSavePolicies(user, policies)
export const listIntegrations = (user) => mockAdminListIntegrations(user)
export const setIntegration = (user, id, enabled) =>
  mockAdminSetIntegration(user, id, enabled)
export const resetAllDemoData = (user) => mockAdminResetDemo(user)
