// Pure rules shared by the wizard and automated tests. All validation is repeated by the Backend in production.
export function validateAssignment({assetIds, beneficiaryIds, executorId, instructions, allocations, contacts}) {
  const issues = [];
  if (!assetIds?.length) issues.push({step:1,message:'Select at least one asset.'});
  if (!beneficiaryIds?.length) issues.push({step:2,message:'Select at least one beneficiary.'});
  if (!executorId) issues.push({step:2,message:'Select an executor.'});
  if (executorId && beneficiaryIds?.includes(executorId)) issues.push({step:2,message:'Executor cannot also be a beneficiary in this assignment.'});
  const ids = new Set((contacts||[]).map(c=>c.id));
  if ((beneficiaryIds||[]).some(id=>!ids.has(id)) || (executorId && !ids.has(executorId))) issues.push({step:2,message:'A selected contact no longer exists.'});
  if (!instructions?.trim()) issues.push({step:3,message:'Handover instructions cannot be empty.'});
  if (beneficiaryIds?.length) {
    const vals = beneficiaryIds.map(id=>{
      const raw=allocations?.[id];
      return raw===undefined || String(raw).trim()===''?NaN:Number(raw);
    });
    if (vals.some(v=>!Number.isInteger(v)||v<1||v>100)) issues.push({step:3,message:'Each beneficiary must have a whole-number allocation from 1% to 100%.'});
    if (vals.every(Number.isFinite)&&vals.reduce((a,b)=>a+b,0)!==100) issues.push({step:3,message:'Total allocation must equal 100%.'});
  }
  return issues;
}

export function createLocalAssignment({assetIds,beneficiaryIds,executorId,instructions,allocations}) {
  return {
    localId: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    assetIds: [...assetIds],
    beneficiaries: beneficiaryIds.map(id=>({id,percentage:Number(allocations[id])})),
    executorId,
    instructions,
    storage: 'browser-demo-only',
  };
}
