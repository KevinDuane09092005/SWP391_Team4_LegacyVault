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

// Flow 6 — Asset Handover. Screens call only these functions.
// No handover API exists in the backend yet, so every function uses the demo mock in
// src/mocks/mockHandoverStore.js. When the API is ready, replace the bodies with fetch
// calls (see dmsService.js for the pattern); the screens do not need to change.

// True while the mock is in use. Pages use it to show the "Demo mode" notices.
export const IS_DEMO_MODE = true

export const listExecutorCases = (user) => mockListExecutorCases(user)
export const startHandover = (user, caseId) => mockStartHandover(user, caseId)

export const listBeneficiaryCases = (user) => mockListBeneficiaryCases(user)
export const getBeneficiaryCase = (user, caseId) => mockGetBeneficiaryCase(user, caseId)
export const verifyIdentity = (user, caseId, form) => mockVerifyIdentity(user, caseId, form)
export const runAuthorizationCheck = (user, caseId) => mockRunAuthorizationCheck(user, caseId)
export const openAsset = (user, caseId, assetId) => mockOpenAsset(user, caseId, assetId)
export const recordAssetDownload = (user, caseId, assetId) => mockRecordAssetDownload(user, caseId, assetId)
export const confirmReceipt = (user, caseId) => mockConfirmReceipt(user, caseId)

export const resetDemoHandovers = (user) => mockResetHandovers(user)
