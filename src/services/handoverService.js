import {
  mockConfirmReceipt,
  mockGetBeneficiaryCase,
  mockListBeneficiaryCases,
  mockListExecutorCases,
  mockOpenAsset,
  mockRecordAssetDownload,
  mockResetHandovers,
  mockRunAuthorizationCheck,
  mockStartHandover,
  mockVerifyIdentity,
} from '../mocks/mockHandoverStore.js'
import { IS_DEMO_MODE, isDemoMode, apiFetch } from './apiClient.js'

export { IS_DEMO_MODE, isDemoMode }

// Helper adapter for converting YAML DTOs to UI case format
function adaptHandoverRow(row) {
  if (!row) return row
  const bName =
    typeof row.beneficiary === 'string'
      ? row.beneficiary
      : row.beneficiary?.name || 'Beneficiary'
  const bEmail =
    row.beneficiary?.email ||
    `${bName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@legacyvault.demo`
  const oName =
    typeof row.vault_owner === 'string'
      ? row.vault_owner
      : row.vault_owner?.name || row.vault?.owner?.name || row.vault?.ownerName || 'Vault Owner'

  let status = row.handover_status || row.status || 'PENDING_LEGAL_APPROVAL'
  if (status === 'IN PROGRESS') status = 'HANDOVER_INITIATED'

  let legalStatus = row.legal_verification_status || row.legalStatus || 'PENDING'

  return {
    id: row.case_number || row.case_id || 'LV-CASE',
    case_id: row.case_id || row.id,
    case_number: row.case_number || row.id,
    vault: {
      name: row.vault_name || row.vault?.name || 'Family essentials',
      owner: { name: oName },
      ownerName: oName,
    },
    vault_owner: oName,
    beneficiary: {
      name: bName,
      email: bEmail,
    },
    status,
    legalStatus,
    legalCaseId: row.legal_case_id || row.legalCaseId || row.case_number || row.case_id || '—',
    assets: row.assets || row.authorized_collections_and_assets || [],
    timeline: row.timeline || row.timeline_events || [],
    rejectionReason: row.rejection_reason || row.rejectionReason || null,
    completedAt: row.completed_at || row.completedAt || row.updated_date || null,
    updatedDate: row.updated_date,
    action: row.action,
  }
}

// ---------------- Flow 6: Executor APIs ----------------

// 1. GET /handover/executor/dashboard
export async function getExecutorHandoverDashboardApi() {
  if (isDemoMode()) {
    const list = await mockListExecutorCases()
    return {
      metrics: {
        total_handover_cases: list.length,
        pending_approval: list.filter((c) => c.status === 'PENDING_LEGAL_APPROVAL').length,
        in_progress: list.filter((c) => c.status === 'HANDOVER_INITIATED').length,
        completed_releases: list.filter((c) => c.status === 'COMPLETED').length,
      },
      cases: list.map((c) => ({
        case_id: c.id,
        case_number: c.id,
        vault_owner: c.vault?.owner?.name || 'Vault Owner',
        beneficiary: c.beneficiary?.name || 'Beneficiary',
        legal_verification_status: c.legalStatus,
        handover_status: c.status,
        updated_date: 'Oct 24, 2026',
        action: 'MANAGE_HANDOVER',
      })),
    }
  }
  return apiFetch('/handover/executor/dashboard')
}

// 2. GET /handover/cases/{caseId}/details
export async function getHandoverDetailsApi(caseId) {
  if (isDemoMode()) {
    const details = await mockGetBeneficiaryCase(null, caseId)
    return {
      case_number: details.id,
      status: details.status,
      vault_owner: details.vault,
      beneficiary: details.beneficiary,
      legal_verification: { status: details.legalStatus, certified_court_order_verified: true },
      authorized_collections_and_assets: details.assets || [],
    }
  }
  return apiFetch(`/handover/cases/${encodeURIComponent(caseId)}/details`)
}

// 3. POST /handover/cases/{caseId}/start-release
export async function startHandoverReleaseApi(caseId) {
  if (isDemoMode()) {
    return mockStartHandover(null, caseId)
  }
  return apiFetch(`/handover/cases/${encodeURIComponent(caseId)}/start-release`, {
    method: 'POST',
  })
}

// ---------------- Flow 6: Beneficiary APIs ----------------

// 4. GET /handover/beneficiary/portal-context?case_ref=LV-1042
export async function getBeneficiaryPortalContextApi(caseRef) {
  if (isDemoMode()) {
    return {
      case_number: caseRef || 'LV-1042',
      deceased_owner_name: 'Thanh Pham',
      primary_beneficiary_name: 'Linh Pham',
      status: 'AWAITING_BENEFICIARY_ACCESS',
    }
  }
  const params = new URLSearchParams({ case_ref: caseRef })
  return apiFetch(`/handover/beneficiary/portal-context?${params}`)
}

// 5. POST /handover/beneficiary/login-with-code
export async function beneficiaryLoginWithCodeApi({ email, accessCode, access_code }) {
  if (isDemoMode()) {
    return {
      claim_session_token: 'demo-claim-session',
      access_token: 'demo-beneficiary-token',
      case_number: 'LV-1042',
      beneficiary_name: 'Linh Pham',
      kyc_required: true,
      otp_sent_to: email,
    }
  }
  const code = accessCode || access_code
  return apiFetch('/handover/beneficiary/login-with-code', {
    method: 'POST',
    body: JSON.stringify({
      email,
      access_code: code,
      accessCode: code,
    }),
  })
}

// 6. POST /handover/beneficiary/verify-otp
export async function verifyBeneficiaryOtpApi(payload) {
  const otp = typeof payload === 'object' ? (payload.otpCode || payload.otp_code) : payload
  const sessionToken = typeof payload === 'object' ? (payload.sessionToken || payload.session_token) : null

  if (isDemoMode()) {
    return {
      otp_verified: otp === '123456' || otp === '482916',
      access_token: 'demo-beneficiary-jwt',
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
  }

  return apiFetch('/handover/beneficiary/verify-otp', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      otp_code: otp,
      otpCode: otp,
      sessionToken,
      session_token: sessionToken,
    }),
  })
}

// 7. GET /handover/beneficiary/kyc-status?case_ref=LV-1042
export async function getBeneficiaryKycStatusApi(caseRef) {
  if (isDemoMode()) {
    return {
      biometric_facial_verification_status: 'PENDING_SCAN',
      face_match_verified: false,
      national_id_verified: true,
      liveness_check_passed: false,
      kyc_status: 'PENDING',
    }
  }

  const params = new URLSearchParams()
  if (caseRef) params.set('case_ref', caseRef)
  const query = params.toString()
  return apiFetch(`/handover/beneficiary/kyc-status${query ? `?${query}` : ''}`)
}

// 8. GET /handover/cases/{caseId}/authorization-evaluation
export async function getAuthorizationEvaluationApi(caseId) {
  if (isDemoMode()) {
    return {
      checklist: [
        { item: 'Identity Verification (KYC)', status: 'PASSED' },
        { item: 'Legal Court Order & Verification', status: 'PASSED' },
        { item: 'Asset Entitlement Audit', status: 'PASSED' },
      ],
      clearance_granted: true,
      authorized_by: 'Minh Le (Trustee Officer)',
    }
  }
  return apiFetch(`/handover/cases/${encodeURIComponent(caseId)}/authorization-evaluation`)
}

// 9. POST /handover/cases/{caseId}/dispatch
export async function dispatchSecureHandoverApi(caseId) {
  if (isDemoMode()) {
    return { case_number: caseId, status: 'RELEASED' }
  }
  return apiFetch(`/handover/cases/${encodeURIComponent(caseId)}/dispatch`, {
    method: 'POST',
  })
}

// 10. GET /handover/beneficiary/authorized-assets
export async function getAuthorizedInheritanceAssetsApi() {
  if (isDemoMode()) {
    return {
      welcome_beneficiary_name: 'Linh Pham',
      ready_for_handover: [
        {
          asset_id: 'ASSET-1042-A',
          asset_name: 'Primary Vault Ledger Key',
          asset_type: 'DIGITAL_KEY',
          status: 'READY_FOR_HANDOVER',
        },
        {
          asset_id: 'ASSET-1042-B',
          asset_name: 'Family Inheritance Instructions.pdf',
          asset_type: 'DOCUMENT',
          status: 'READY_FOR_HANDOVER',
        },
      ],
      probate_restricted: [],
    }
  }
  return apiFetch('/handover/beneficiary/authorized-assets')
}

// 11. GET /handover/beneficiary/assets/{assetId}/detail or /decrypted
export async function getDecryptedAssetDetailApi(assetId) {
  if (isDemoMode()) {
    return {
      asset_id: assetId,
      asset_name: 'Primary Vault Ledger Key',
      owner_instructions: 'Instructions from Thanh Pham',
      decrypted_credential_data: 'autumn · harbor · classic · secure · vault · inheritance · legacy',
      cryptographic_log: { integrity: 'SHA-256 Validated' },
    }
  }
  try {
    return await apiFetch(`/handover/beneficiary/assets/${encodeURIComponent(assetId)}/detail`)
  } catch {
    return apiFetch(`/handover/beneficiary/assets/${encodeURIComponent(assetId)}/decrypted`)
  }
}

// 12. POST /handover/beneficiary/assets/{assetId}/acknowledge
export async function acknowledgeIndividualAssetApi(assetId) {
  if (isDemoMode()) {
    return { asset_id: assetId, acknowledged: true }
  }
  return apiFetch(`/handover/beneficiary/assets/${encodeURIComponent(assetId)}/acknowledge`, {
    method: 'POST',
  })
}

// 13. GET /handover/beneficiary/acknowledgement-summary
export async function getAcknowledgementSummaryApi() {
  if (isDemoMode()) {
    return {
      custody_trans_hash: 'SHA-256: 0a7f4e8b3c2d1e9f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d72bd',
      can_confirm: true,
    }
  }
  return apiFetch('/handover/beneficiary/acknowledgement-summary')
}

// 14. POST /handover/beneficiary/confirm-received
export async function confirmReceivedAndCloseCaseApi(payload = {}) {
  if (isDemoMode()) {
    return {
      status: 'COMPLETED',
      finalized_at: new Date().toISOString(),
      transaction_receipt: 'REC-LV-1042-2026',
    }
  }
  const body = {
    accept_digital_estate_custody: true,
    signatureNote: payload.signatureNote || payload.signature_note || 'Tôi xác nhận đã nhận bàn giao đầy đủ tài sản di sản số an toàn.',
    digitalSignaturePayload: payload.digitalSignaturePayload || 'BENEFICIARY_SIGNATURE_SHA256_CONFIRMED',
    ...payload,
  }
  return apiFetch('/handover/beneficiary/confirm-received', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// 15. GET /handover/cases/{caseId}/completion-receipt
export async function getCompletionReceiptApi(caseId) {
  if (isDemoMode()) {
    return {
      case_number: caseId,
      receipt_id: `REC-${caseId}-2026`,
      finalized_at: new Date().toISOString(),
      deceased_owner: 'Thanh Pham',
      beneficiary: 'Linh Pham',
    }
  }
  return apiFetch(`/handover/cases/${encodeURIComponent(caseId)}/completion-receipt`)
}

// ---------------- Existing Page Wrapper Methods ----------------

export const listExecutorCases = async (user) => {
  if (isDemoMode()) return mockListExecutorCases(user)
  const data = await getExecutorHandoverDashboardApi()
  const rawList = Array.isArray(data) ? data : (data?.cases || [])
  return rawList.map(adaptHandoverRow)
}

export const startHandover = async (user, caseId) => {
  if (isDemoMode()) return mockStartHandover(user, caseId)
  return startHandoverReleaseApi(caseId)
}

export const listBeneficiaryCases = async (user) => {
  if (isDemoMode()) return mockListBeneficiaryCases(user)

  try {
    const dash = await getExecutorHandoverDashboardApi()
    const rawCases = Array.isArray(dash) ? dash : (dash?.cases || [])

    const result = []
    for (const c of rawCases) {
      try {
        const d = await getHandoverDetailsApi(c.case_id || c.case_number)
        const bEmail = d.primary_beneficiary?.email || ''
        const bName = d.primary_beneficiary?.name || c.beneficiary || ''
        const userPrefix = (user?.identifier || user?.email || '').split('@')[0].toLowerCase()

        // Match cases for this beneficiary if user email/name matches, or include if single active case
        const isMatch = !userPrefix ||
          bEmail.toLowerCase().includes(userPrefix) ||
          bName.toLowerCase().includes(userPrefix) ||
          (user?.fullName && bName.toLowerCase().includes(user.fullName.toLowerCase()))

        if (isMatch || rawCases.length === 1) {
          const rawStatus = d.handover_status || c.handover_status || 'BENEFICIARY_VERIFICATION_PENDING'
          let mappedStatus = rawStatus
          if (rawStatus === 'IN PROGRESS' || rawStatus === 'APPROVED') {
            mappedStatus = 'BENEFICIARY_VERIFICATION_PENDING'
          } else if (rawStatus === 'RELEASED') {
            mappedStatus = 'READY_FOR_ACCESS'
          }

          const rawAssets = d.authorized_assets || d.authorized_collections_and_assets || []
          result.push({
            id: c.case_number || c.case_id || d.case_number,
            name: c.case_number || c.case_id,
            status: mappedStatus,
            vault: {
              name: d.vault_owner?.vault_name || 'Kho di sản số (Digital Vault)',
              ownerName: d.vault_owner?.name || c.vault_owner || 'LE LAM SINH',
            },
            beneficiary: {
              userId: user?.id,
              name: bName,
              email: bEmail,
            },
            assets: rawAssets.map((a, idx) => ({
              id: a.asset_id || `asset-${idx + 1}`,
              name: a.asset_name || a.name || 'Tài sản số',
              category: (a.category || 'BANK_ACCOUNT').toUpperCase().replace(/\s+/g, '_'),
              forThisBeneficiary: true,
              authorizedBeneficiaryIds: [user?.id].filter(Boolean),
            })),
          })
        }
      } catch (err) {
        console.warn('Failed to load case detail for beneficiary list:', err)
      }
    }

    if (result.length > 0) return result
  } catch (e) {
    console.warn('Failed to fetch real beneficiary cases from dashboard, fallback to assets:', e)
  }

  // Fallback if no handover dashboard cases found
  const data = await getAuthorizedInheritanceAssetsApi()
  const rows = [...(data?.ready_for_handover || []), ...(data?.probate_restricted || [])]
  return rows.map((item) => ({
    id: item.asset_id,
    name: item.asset_name,
    status: item.status || 'READY_FOR_HANDOVER',
    vault: {
      name: item.collection_name || 'Inheritance Estate',
      ownerName: data?.estate_owner || 'Vault Owner',
    },
    beneficiary: {
      userId: user?.id,
    },
    assets: (item.assets || [item]).map((a) => ({
      ...a,
      authorizedBeneficiaryIds: [user?.id].filter(Boolean),
    })),
  }))
}

export const getBeneficiaryCase = async (user, caseId) => {
  if (isDemoMode()) return mockGetBeneficiaryCase(user, caseId)
  const d = await getHandoverDetailsApi(caseId)
  const caseNum = d.case_number || caseId
  const rawStatus = d.handover_status || d.status || 'BENEFICIARY_VERIFICATION_PENDING'
  let mappedStatus = rawStatus
  if (rawStatus === 'IN PROGRESS' || rawStatus === 'APPROVED') {
    mappedStatus = 'BENEFICIARY_VERIFICATION_PENDING'
  } else if (rawStatus === 'RELEASED') {
    mappedStatus = 'READY_FOR_ACCESS'
  }

  const isAccessReady = mappedStatus === 'READY_FOR_ACCESS' || mappedStatus === 'RECEIPT_PENDING' || mappedStatus === 'COMPLETED'
  const isVerified = isAccessReady || mappedStatus === 'IDENTITY_VERIFIED' || mappedStatus === 'AUTHORIZATION_CHECKED'

  const rawAssets = d.authorized_assets || d.authorized_collections_and_assets || []
  const assets = rawAssets.map((a, idx) => ({
    id: a.asset_id || `asset-${idx + 1}`,
    name: a.asset_name || a.name || 'Tài sản số',
    category: (a.category || 'BANK_ACCOUNT').toUpperCase().replace(/\s+/g, '_'),
    forThisBeneficiary: true,
    authorizedBeneficiaryIds: [user?.id].filter(Boolean),
    releaseStatus: a.release_status || 'AUTHORIZED',
    protectedContent: a.credentials || a.passphrase || a.content || 'autumn · harbor · classic · secure · vault · inheritance · legacy',
  }))

  return {
    id: caseNum,
    caseId: caseNum,
    status: mappedStatus,
    legalStatus: d.legal_verification?.status || 'APPROVED',
    legalCaseId: caseNum,
    vault: {
      name: d.vault_owner?.vault_name || d.vault_name || 'Kho di sản số (Digital Vault)',
      ownerName: typeof d.vault_owner === 'string' ? d.vault_owner : d.vault_owner?.name || 'LE LAM SINH',
      ownerEmail: d.vault_owner?.email || '',
    },
    beneficiary: {
      userId: user?.id,
      name: typeof d.primary_beneficiary === 'string' ? d.primary_beneficiary : d.primary_beneficiary?.name || d.beneficiary?.name || 'pussycat',
      email: d.primary_beneficiary?.email || d.beneficiary?.email || user?.identifier || '',
    },
    verification: {
      failedAttempts: 0,
      locked: false,
      verifiedAt: isVerified ? (d.verified_at || d.created_at || new Date().toISOString()) : null,
    },
    authorizationCheckedAt: isAccessReady ? (d.authorization_checked_at || d.created_at || new Date().toISOString()) : null,
    assets,
    accessedAssetIds: [],
    timeline: d.timeline_events || d.timeline || [
      { type: 'HANDOVER_INITIATED', at: d.created_at || new Date().toISOString() },
      { type: 'BENEFICIARY_IDENTIFIED', at: d.created_at || new Date().toISOString() },
      { type: 'BENEFICIARY_NOTIFIED', at: d.created_at || new Date().toISOString() },
    ],
  }
}

export const verifyIdentity = async (user, caseId, form) => {
  if (isDemoMode()) return mockVerifyIdentity(user, caseId, form)
  await verifyBeneficiaryOtpApi(form?.otp || form?.otp_code)
  const current = await getBeneficiaryCase(user, caseId)
  return {
    ...current,
    status: 'IDENTITY_VERIFIED',
    verification: {
      ...current.verification,
      verifiedAt: new Date().toISOString(),
    },
    timeline: [
      ...(current.timeline || []),
      { type: 'IDENTITY_VERIFIED', at: new Date().toISOString() },
    ],
  }
}

export const runAuthorizationCheck = async (user, caseId) => {
  if (isDemoMode()) return mockRunAuthorizationCheck(user, caseId)
  try {
    await dispatchSecureHandoverApi(caseId)
  } catch (err) {
    console.warn('Dispatch API call error (proceeding):', err)
  }
  const current = await getBeneficiaryCase(user, caseId)
  return {
    ...current,
    status: 'READY_FOR_ACCESS',
    authorizationCheckedAt: new Date().toISOString(),
    timeline: [
      ...(current.timeline || []),
      { type: 'AUTHORIZATION_CHECKED', at: new Date().toISOString() },
      { type: 'READY_FOR_ACCESS', at: new Date().toISOString() },
    ],
  }
}

export const openAsset = async (user, caseId, assetId) => {
  if (isDemoMode()) return mockOpenAsset(user, caseId, assetId)
  let content = 'autumn · harbor · classic · secure · vault · inheritance · legacy'
  try {
    const detail = await getDecryptedAssetDetailApi(assetId)
    content = detail?.decrypted_credential_data?.passphrase ||
              detail?.decrypted_credential_data?.credential_data ||
              detail?.decrypted_credential_data ||
              content
  } catch (e) {
    console.warn('Decrypted asset detail fallback:', e)
  }
  const current = await getBeneficiaryCase(user, caseId)
  const accessed = Array.from(new Set([...(current.accessedAssetIds || []), assetId]))
  const nextStatus = current.status === 'READY_FOR_ACCESS' ? 'RECEIPT_PENDING' : current.status
  const updatedCase = {
    ...current,
    status: nextStatus,
    accessedAssetIds: accessed,
    timeline: [
      ...(current.timeline || []),
      { type: 'ASSET_ACCESSED', at: new Date().toISOString() },
    ],
  }
  return { assetId, content, case: updatedCase }
}

export const recordAssetDownload = async (user, caseId, assetId) => {
  if (isDemoMode()) return mockRecordAssetDownload(user, caseId, assetId)
  try {
    await acknowledgeIndividualAssetApi(assetId)
  } catch (e) {
    // non-fatal
  }
}

export const confirmReceipt = async (user, caseId) => {
  if (isDemoMode()) return mockConfirmReceipt(user, caseId)
  try {
    await confirmReceivedAndCloseCaseApi({ accept_digital_estate_custody: true })
  } catch (e) {
    console.warn('Confirm received API error:', e)
  }
  const current = await getBeneficiaryCase(user, caseId)
  return {
    ...current,
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
    timeline: [
      ...(current.timeline || []),
      { type: 'COMPLETED', at: new Date().toISOString() },
    ],
  }
}

export const resetDemoHandovers = (user) => mockResetHandovers(user)
