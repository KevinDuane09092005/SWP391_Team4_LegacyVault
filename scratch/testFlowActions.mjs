const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzMzMzMzMzMy0zMzMzLTMzMzMtMzMzMy0zMzMzMzMzMzMzMzMiLCJlbWFpbCI6IlNpbmhMTFNFMTcxNzYxQGZwdC5lZHUudm4iLCJyb2xlIjoiQkVORUZJQ0lBUlkiLCJpYXQiOjE3OTI2MDY5NTksImV4cCI6MTc5MjY5MzM1OX0.lXrciMCe0cIKgO5rW3WXQN4yit2M-A7cW9LgdKpi50o';
const caseId = 'HC-20261022-450CB014';

// 1. verify OTP
const otpRes = await fetch('http://localhost:8080/api/v1/handover/beneficiary/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ otp_code: '482916' })
});
console.log('OTP verify status:', otpRes.status, await otpRes.json().catch(() => ({})));

// 2. dispatch
const dispatchRes = await fetch(`http://localhost:8080/api/v1/handover/cases/${caseId}/dispatch`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
console.log('Dispatch status:', dispatchRes.status, await dispatchRes.json().catch(() => ({})));

// 3. asset detail
const detailRes = await fetch(`http://localhost:8080/api/v1/handover/beneficiary/assets/asset-1/detail`, {
  headers: { Authorization: `Bearer ${token}` }
});
console.log('Asset detail status:', detailRes.status, (await detailRes.json().catch(() => ({}))).asset_name);
