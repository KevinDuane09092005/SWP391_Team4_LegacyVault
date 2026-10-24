const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzMzMzMzMzMy0zMzMzLTMzMzMtMzMzMy0zMzMzMzMzMzMzMzMiLCJlbWFpbCI6IlNpbmhMTFNFMTcxNzYxQGZwdC5lZHUudm4iLCJyb2xlIjoiQkVORUZJQ0lBUlkiLCJpYXQiOjE3OTI2MDY5NTksImV4cCI6MTc5MjY5MzM1OX0.lXrciMCe0cIKgO5rW3WXQN4yit2M-A7cW9LgdKpi50o';

// Let's test calling various GET endpoints with this token:
const tests = [
  '/api/v1/handover/cases',
  '/api/v1/handover/beneficiary/authorized-assets',
  '/api/v1/handover/executor/dashboard',
  '/api/v1/contacts',
  '/api/v1/assets',
  '/api/v1/assignments'
];

for (const t of tests) {
  const r = await fetch(`http://localhost:8080${t}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`[${r.status}] ${t}`);
  try {
    const data = await r.json();
    console.log('  Data:', JSON.stringify(data).slice(0, 300));
  } catch (e) {
    const text = await r.text().catch(() => '');
    console.log('  Text:', text.slice(0, 100));
  }
}
