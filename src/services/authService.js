import {
  mockLogin,
  mockLogout,
  mockRegister,
  mockRequestPasswordReset,
  mockResendOtp,
  mockVerifyOtp,
} from '../mocks/mockAuth.js'
import { readSession } from '../auth/session.js'

// The ONLY place pages call for authentication (Flow 1).
//
// Right now every function uses the demo mock in src/mocks/mockAuth.js.
// When the backend is ready, replace each body with a request that follows the
// backend's real API contract. Keep the same inputs and outputs below so the pages
// do not need to change, and throw `new AuthError(code)` (src/auth/AuthError.js)
// so the right translated message is shown.

export { IS_DEMO_MODE } from './apiClient.js'

// Input:  { fullName, identifier, password, plan, billing }  (identifier = email or phone)
// Output: { identifier, verificationRequired: true }
export function register(data) {
  return mockRegister(data)
}

// Input:  { identifier, code }
// Output: { verified: true }
export function verifyOtp(data) {
  return mockVerifyOtp(data)
}

// Input:  { identifier }
// Output: { resent: true }
export function resendOtp(data) {
  return mockResendOtp(data)
}

// Input:  { identifier, password }
// Output: { user: { id, fullName, identifier, role } }
export function login(data) {
  return mockLogin(data)
}

// Input:  { identifier }
// Output: { requested: true }
export function requestPasswordReset(data) {
  return mockRequestPasswordReset(data)
}

// Output: { id, fullName, identifier, role } or null.
// Demo: reads the saved session. With a backend this should ask the server who is signed in.
export async function getCurrentUser() {
  return readSession()?.user ?? null
}

// With a backend this should end the session on the server too.
export function logout() {
  return mockLogout()
}
