import { apiFetch } from './apiClient.js'

export function getBeneficiaryFaceEnrollmentApi() {
  return apiFetch('/handover/beneficiary/face/enrollment')
}

export function createBeneficiaryFaceCheckApi(caseRef) {
  return apiFetch(`/handover/beneficiary/face/cases/${encodeURIComponent(caseRef)}/sessions`, {
    method: 'POST',
  })
}

export function completeBeneficiaryFaceCheckApi(caseRef, sessionId, payload) {
  return apiFetch(
    `/handover/beneficiary/face/cases/${encodeURIComponent(caseRef)}/sessions/${encodeURIComponent(sessionId)}/complete`,
    {
      method: 'POST',
      body: payload,
    },
  )
}
