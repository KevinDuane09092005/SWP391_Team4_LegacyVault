import {
  mockLogin,
  mockLogout,
  mockRegister,
  mockRequestPasswordReset,
  mockResendOtp,
  mockVerifyOtp,
} from '../mocks/mockAuth.js'
import { readSession } from '../auth/session.js'
import { AuthError } from '../auth/AuthError.js'
import { apiFetch, IS_DEMO_MODE } from './apiClient.js'

export { IS_DEMO_MODE }

function normalizeRole(role) {
  return String(role || 'VAULT_OWNER').trim().toUpperCase().replace(/[ -]+/g, '_')
}

function authFailure(error, fallbackCode) {
  if (error instanceof AuthError) return error
  const message = String(error?.message || '')
  const lower = message.toLowerCase()
  let code = fallbackCode

  if (error?.status === 0 || lower.includes('failed to fetch') || lower.includes('network')) {
    code = 'NETWORK'
  } else if (lower.includes('already exists') || lower.includes('already registered')) {
    code = 'ACCOUNT_EXISTS'
  } else if (lower.includes('not verified') || lower.includes('verify otp')) {
    code = 'ACCOUNT_NOT_VERIFIED'
  } else if (lower.includes('otp') && (lower.includes('invalid') || lower.includes('expired'))) {
    code = 'INVALID_OTP'
  } else if (lower.includes('credential') || lower.includes('password')) {
    code = 'INVALID_CREDENTIALS'
  }

  return new AuthError(code, message || code)
}

export async function register(data) {
  if (IS_DEMO_MODE) return mockRegister(data)
  try {
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: {
        fullName: data.fullName,
        email: data.identifier,
        password: data.password,
      },
    })
    return {
      identifier: data.identifier,
      fullName: data.fullName,
      verificationRequired: true,
      userId: response.userId,
      testOtp: response.testOtp,
    }
  } catch (error) {
    throw authFailure(error, 'REGISTRATION_FAILED')
  }
}

export async function verifyOtp({ identifier, code }) {
  if (IS_DEMO_MODE) return mockVerifyOtp({ identifier, code })
  try {
    await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: { email: identifier, otpCode: code },
    })
    return { verified: true }
  } catch (error) {
    throw authFailure(error, 'INVALID_OTP')
  }
}

export async function resendOtp({ identifier }) {
  if (IS_DEMO_MODE) return mockResendOtp({ identifier })
  // The current Spring Boot API has no resend-OTP endpoint. Do not silently
  // pretend the backend sent a code by falling back to a browser mock.
  throw new AuthError('OTP_RESEND_UNAVAILABLE')
}

export async function login({ identifier, password }) {
  if (IS_DEMO_MODE) return mockLogin({ identifier, password })
  try {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email: identifier, password },
    })
    return {
      user: {
        id: response.userId,
        fullName: response.fullName || identifier.split('@')[0],
        identifier,
        role: normalizeRole(response.role),
        token: response.token,
      },
    }
  } catch (error) {
    throw authFailure(error, 'INVALID_CREDENTIALS')
  }
}

export async function requestPasswordReset(data) {
  if (IS_DEMO_MODE) return mockRequestPasswordReset(data)
  throw new AuthError('PASSWORD_RESET_UNAVAILABLE')
}

export async function getCurrentUser() {
  // There is no /auth/me endpoint yet, so use the public profile saved alongside
  // the backend-issued JWT. Protected API calls remain authorized by the server.
  return readSession()?.user ?? null
}

export async function logout() {
  if (IS_DEMO_MODE) return mockLogout()
  // The backend currently uses stateless JWTs and exposes no logout endpoint.
  return null
}
