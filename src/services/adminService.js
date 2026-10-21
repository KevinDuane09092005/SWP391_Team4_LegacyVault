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

// Flow 7 — Administration. No admin API exists yet, so every function uses the demo mock
// in src/mocks/mockAdminStore.js. Changes are simulated: they are audited and notified,
// but they do not change sign-in, route guards or any real security infrastructure.

export const IS_DEMO_MODE = true

export const listUsers = (user) => mockAdminListUsers(user)
export const setUserStatus = (user, userId, status) => mockAdminSetUserStatus(user, userId, status)
export const setUserRole = (user, userId, role) => mockAdminSetUserRole(user, userId, role)
export const getPermissions = (user) => mockAdminGetPermissions(user)
export const setPermission = (user, role, permission, granted) => mockAdminSetPermission(user, role, permission, granted)
export const getPolicies = (user) => mockAdminGetPolicies(user)
export const savePolicies = (user, policies) => mockAdminSavePolicies(user, policies)
export const listIntegrations = (user) => mockAdminListIntegrations(user)
export const setIntegration = (user, id, enabled) => mockAdminSetIntegration(user, id, enabled)
export const resetAllDemoData = (user) => mockAdminResetDemo(user)
