const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzMzMzMzMzMy0zMzMzLTMzMzMtMzMzMy0zMzMzMzMzMzMzMzMiLCJlbWFpbCI6IlNpbmhMTFNFMTcxNzYxQGZwdC5lZHUudm4iLCJyb2xlIjoiQkVORUZJQ0lBUlkiLCJpYXQiOjE3OTI2MDY5NTksImV4cCI6MTc5MjY5MzM1OX0.lXrciMCe0cIKgO5rW3WXQN4yit2M-A7cW9LgdKpi50o';

const endpoints = [
  '/api/v1/handover/beneficiary/authorized-assets',
  '/api/v1/handover/beneficiary/portal-context?case_ref=LV-1042',
  '/api/v1/handover/beneficiary/cases',
  '/api/v1/handover/beneficiary/dashboard',
  '/api/v1/handover/cases',
  '/api/v1/handover/my-cases',
  '/api/v1/handover/beneficiary',
  '/api/v1/beneficiary/cases',
  '/api/v1/beneficiary/handovers',
  '/api/v1/beneficiary/dashboard',
  '/api/v1/beneficiary/assets',
  '/api/v1/handovers',
  '/api/v1/legal-verification/cases'
];

for (const ep of endpoints) {
  try {
    const res = await fetch(`http://localhost:8080${ep}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`${res.status} ${ep}`);
    if (res.status === 200) {
      const text = await res.text();
      console.log('  Response:', text.slice(0, 300));
    }
  } catch (e) {
    console.log(`ERR ${ep}:`, e.message);
  }
}
