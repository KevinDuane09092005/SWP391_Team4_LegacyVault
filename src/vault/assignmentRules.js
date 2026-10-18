// Pure rules shared by the wizard and automated tests. All validation is repeated by the Backend in production.
export function validateAssignment({ assetIds, beneficiaryIds, executorId, instructions, allocations, contacts }) {
  const issues = []
  if (!assetIds?.length) issues.push({ step: 1, message: 'Select at least one asset.' })
  if (!beneficiaryIds?.length) issues.push({ step: 2, message: 'Select at least one beneficiary.' })
  if (!executorId) issues.push({ step: 2, message: 'Select an executor.' })
  if (executorId && beneficiaryIds?.includes(executorId)) {
    issues.push({ step: 2, message: 'Executor cannot also be a beneficiary in this assignment.' })
  }
  const ids = new Set((contacts || []).map((c) => c.id))
  if ((beneficiaryIds || []).some((id) => !ids.has(id)) || (executorId && !ids.has(executorId))) {
    issues.push({ step: 2, message: 'A selected contact no longer exists.' })
  }
  if (!instructions?.trim()) issues.push({ step: 3, message: 'Handover instructions cannot be empty.' })
  return issues
}

export function createLocalAssignment({ assetIds, beneficiaryIds, executorId, instructions, allocations }) {
  return {
    localId: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    assetIds: [...assetIds],
    beneficiaries: beneficiaryIds.map((id) => ({ id, percentage: Number(allocations[id]) })),
    executorId,
    instructions,
    storage: 'browser-demo-only',
  }
}
