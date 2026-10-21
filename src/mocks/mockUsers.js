import { ROLES } from '../auth/roles.js'

// DEMO ONLY — fake accounts so every role can be tried without a backend.
// The password is written in source code on purpose so testers can use it.
// Never do this with real accounts.

export const DEMO_PASSWORD = 'Demo@1234'

// The only code the demo OTP check accepts. No email or SMS is ever sent.
export const DEMO_OTP_CODE = '123456'

export const mockUsers = [
  {
    id: 'demo-admin',
    fullName: 'Demo Admin',
    identifier: 'admin@legacyvault.demo',
    role: ROLES.ADMIN,
  },
  {
    id: 'demo-owner',
    fullName: 'Demo Vault Owner',
    identifier: 'owner@legacyvault.demo',
    role: ROLES.VAULT_OWNER,
  },
  {
    id: 'demo-owner-phone',
    fullName: 'Demo Owner (phone)',
    identifier: '0901234567',
    role: ROLES.VAULT_OWNER,
  },
  {
    id: 'demo-executor',
    fullName: 'Demo Executor',
    identifier: 'executor@legacyvault.demo',
    role: ROLES.EXECUTOR,
  },
  {
    id: 'demo-beneficiary',
    fullName: 'Demo Beneficiary',
    identifier: 'beneficiary@legacyvault.demo',
    role: ROLES.BENEFICIARY,
  },
  {
    // Second beneficiary, used by Flow 6 to show that beneficiaries only see their own assets.
    id: 'demo-beneficiary-2',
    fullName: 'Second Beneficiary',
    identifier: 'beneficiary2@legacyvault.demo',
    role: ROLES.BENEFICIARY,
  },
  {
    id: 'demo-verifier',
    fullName: 'Demo Legal Verifier',
    identifier: 'verifier@legacyvault.demo',
    role: ROLES.LEGAL_VERIFIER,
  },
]
