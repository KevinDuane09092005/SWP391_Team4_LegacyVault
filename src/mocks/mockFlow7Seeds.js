import { AUDIT_ACTIONS as A, OUTCOME, SEVERITY } from '../audit/auditRules.js'
import { ROLES } from '../auth/roles.js'

// DEMO ONLY — starting notifications and audit entries, so the screens are not empty.
// They describe the seeded handover cases in mockHandovers.js. Flow 5 (Legal Verification)
// is not part of this app yet, so its "approved / rejected" events exist only as this seed data.

const at = (day, time) => `2026-10-${day}T${time}:00.000Z`
const verifier = { id: 'demo-verifier', name: 'Demo Legal Verifier', role: ROLES.LEGAL_VERIFIER }
const executor = { id: 'demo-executor', name: 'Demo Executor', role: ROLES.EXECUTOR }
const beneficiary = { id: 'demo-beneficiary', name: 'Demo Beneficiary', role: ROLES.BENEFICIARY }

const legalApproved = [
  ['HO-2041', 'LV-1038', '15'],
  ['HO-2044', 'LV-1038', '15'],
  ['HO-2045', 'LV-1040', '16'],
  ['HO-2046', 'LV-1041', '16'],
  ['HO-2047', 'LV-1044', '17'],
  ['HO-2048', 'LV-1036', '08'],
]

export const seedNotifications = [
  ...legalApproved.map(([caseId, legalCaseId, day]) => ({
    id: `ntf-seed-legal-${caseId}`,
    userId: executor.id,
    type: 'LEGAL_APPROVED',
    params: { caseId, legalCaseId },
    caseId,
    createdAt: at(day, '08:00'),
    read: caseId === 'HO-2048',
  })),
  {
    id: 'ntf-seed-start-HO-2047',
    userId: beneficiary.id,
    type: 'HANDOVER_STARTED',
    params: { caseId: 'HO-2047', ownerName: 'Demo Vault Owner' },
    caseId: 'HO-2047',
    createdAt: at('18', '09:01'),
    read: false,
  },
  {
    id: 'ntf-seed-start-HO-2048',
    userId: beneficiary.id,
    type: 'HANDOVER_STARTED',
    params: { caseId: 'HO-2048', ownerName: 'Demo Vault Owner' },
    caseId: 'HO-2048',
    createdAt: at('09', '15:01'),
    read: true,
  },
  {
    id: 'ntf-seed-done-HO-2048-ben',
    userId: beneficiary.id,
    type: 'HANDOVER_COMPLETED',
    params: { caseId: 'HO-2048', beneficiaryName: beneficiary.name },
    caseId: 'HO-2048',
    createdAt: at('10', '10:20'),
    read: true,
  },
  {
    id: 'ntf-seed-done-HO-2048-exe',
    userId: executor.id,
    type: 'HANDOVER_COMPLETED',
    params: { caseId: 'HO-2048', beneficiaryName: beneficiary.name },
    caseId: 'HO-2048',
    createdAt: at('10', '10:20'),
    read: true,
  },
]

const entry = (id, time, actor, action, outcome, extra = {}) => ({
  id: `aud-seed-${id}`,
  at: time,
  actor,
  action,
  outcome,
  severity: extra.severity ?? SEVERITY.INFO,
  entity: extra.entity ?? null,
  caseId: extra.caseId ?? null,
  details: extra.details ?? {},
  seeded: true,
})

export const seedAuditLog = [
  ...legalApproved.map(([caseId, legalCaseId, day]) =>
    entry(`legal-${caseId}`, at(day, '08:00'), verifier, A.LEGAL_STATUS_CHANGED, OUTCOME.SUCCESS, {
      entity: { type: 'LEGAL_CASE', id: legalCaseId },
      caseId,
      details: { legalStatus: 'APPROVED' },
    })),
  entry('legal-HO-2039', at('14', '11:00'), verifier, A.LEGAL_STATUS_CHANGED, OUTCOME.SUCCESS, {
    entity: { type: 'LEGAL_CASE', id: 'LV-1035' },
    caseId: 'HO-2039',
    details: { legalStatus: 'REJECTED' },
  }),
  entry('start-HO-2048', at('09', '15:00'), executor, A.HANDOVER_START, OUTCOME.SUCCESS, {
    entity: { type: 'HANDOVER', id: 'HO-2048' }, caseId: 'HO-2048', details: { beneficiaryId: beneficiary.id },
  }),
  entry('verify-fail-HO-2048', at('10', '10:02'), beneficiary, A.IDENTITY_VERIFICATION, OUTCOME.FAILURE, {
    entity: { type: 'HANDOVER', id: 'HO-2048' }, caseId: 'HO-2048', severity: SEVERITY.WARNING, details: { attemptsLeft: 4 },
  }),
  entry('verify-ok-HO-2048', at('10', '10:05'), beneficiary, A.IDENTITY_VERIFICATION, OUTCOME.SUCCESS, {
    entity: { type: 'HANDOVER', id: 'HO-2048' }, caseId: 'HO-2048',
  }),
  entry('auth-HO-2048', at('10', '10:06'), beneficiary, A.AUTHORIZATION_CHECK, OUTCOME.SUCCESS, {
    entity: { type: 'HANDOVER', id: 'HO-2048' }, caseId: 'HO-2048', details: { authorizedAssets: 1 },
  }),
  entry('asset-HO-2048', at('10', '10:10'), beneficiary, A.ASSET_ACCESS, OUTCOME.SUCCESS, {
    entity: { type: 'ASSET', id: 'ho-asset-letter' }, caseId: 'HO-2048',
  }),
  entry('receipt-HO-2048', at('10', '10:20'), beneficiary, A.RECEIPT_CONFIRMATION, OUTCOME.SUCCESS, {
    entity: { type: 'HANDOVER', id: 'HO-2048' }, caseId: 'HO-2048',
  }),
  entry('done-HO-2048', at('10', '10:20'), beneficiary, A.HANDOVER_COMPLETED, OUTCOME.SUCCESS, {
    entity: { type: 'HANDOVER', id: 'HO-2048' }, caseId: 'HO-2048',
  }),
  entry('start-HO-2047', at('18', '09:00'), executor, A.HANDOVER_START, OUTCOME.SUCCESS, {
    entity: { type: 'HANDOVER', id: 'HO-2047' }, caseId: 'HO-2047', details: { beneficiaryId: beneficiary.id },
  }),
]
