import {
  mockLogin,
  mockLogout,
  mockRegister,
  mockRequestPasswordReset,
  mockResendOtp,
  mockVerifyOtp,
} from '../mocks/mockAuth.js'
import { ROLES, normalizeRole } from '../auth/roles.js'
import { readSession } from '../auth/session.js'
import { AuthError } from '../auth/AuthError.js'
import { apiFetch, IS_DEMO_MODE } from './apiClient.js'

export { IS_DEMO_MODE }

function normalizeContextItem(ctx) {
  if (!ctx) return null
  const role = normalizeRole(ctx.roleCode || ctx.role)
  return {
    role,
    roleCode: ctx.roleCode || role,
    roleName: ctx.roleName || '',
    scope: ctx.scope || (role === ROLES.ADMIN || role === ROLES.LEGAL_VERIFIER ? 'SYSTEM' : 'VAULT'),
    ownerId: ctx.ownerId || null,
    ownerFullName: ctx.ownerFullName || null,
    ownerEmail: ctx.ownerEmail || null,
    contactId: ctx.contactId || null,
  }
}

export function buildAvailableContexts(rawContexts, primaryRole, userId, fullName, email) {
  const normalized = Array.isArray(rawContexts)
    ? rawContexts.map(normalizeContextItem).filter(Boolean)
    : []

  if (normalized.length > 0) {
    return normalized
  }

  return [
    {
      role: normalizeRole(primaryRole),
      roleCode: normalizeRole(primaryRole),
      roleName: 'Vault Owner',
      scope: 'VAULT',
      ownerId: userId || null,
      ownerFullName: fullName || null,
      ownerEmail: email || null,
      contactId: null,
    },
  ]
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
  } else if (lower.includes('suspended') || lower.includes('tạm khóa') || lower.includes('đình chỉ')) {
    code = 'ACCOUNT_SUSPENDED'
  } else if (lower.includes('deactivated') || lower.includes('vô hiệu hóa')) {
    code = 'ACCOUNT_DEACTIVATED'
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
  try {
    const response = await apiFetch('/auth/resend-otp', {
      method: 'POST',
      body: { email: identifier },
    })
    return { resent: true, message: response?.message }
  } catch (error) {
    throw authFailure(error, 'OTP_RESEND_UNAVAILABLE')
  }
}

export async function login({ identifier, password }) {
  if (IS_DEMO_MODE) return mockLogin({ identifier, password })
  try {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email: identifier, password },
    })
    const role = normalizeRole(response.role)
    const fullName = response.fullName || identifier.split('@')[0]
    const email = response.email || identifier
    const availableContexts = buildAvailableContexts(
      response.availableContexts,
      role,
      response.userId,
      fullName,
      email,
    )
    return {
      user: {
        id: response.userId,
        fullName,
        identifier: email,
        role,
        availableContexts,
        activeContext: availableContexts[0] || null,
        token: response.token,
      },
      token: response.token,
    }
  } catch (error) {
    throw authFailure(error, 'INVALID_CREDENTIALS')
  }
}

export async function getAuthContexts() {
  if (IS_DEMO_MODE) return null
  try {
    const response = await apiFetch('/auth/contexts', {
      method: 'GET',
    })
    const rawContexts = response?.availableContexts || []
    return rawContexts.map(normalizeContextItem).filter(Boolean)
  } catch {
    return null
  }
}

export async function requestPasswordReset(data) {
  if (IS_DEMO_MODE) return mockRequestPasswordReset(data)
  throw new AuthError('PASSWORD_RESET_UNAVAILABLE')
}

export async function getCurrentUser() {
  return readSession()?.user ?? null
}

export async function logout() {
  if (IS_DEMO_MODE) return mockLogout()
  return null
}
