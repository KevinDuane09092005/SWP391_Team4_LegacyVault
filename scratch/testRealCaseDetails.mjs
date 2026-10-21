const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzMzMzMzMzMy0zMzMzLTMzMzMtMzMzMy0zMzMzMzMzMzMzMzMiLCJlbWFpbCI6IlNpbmhMTFNFMTcxNzYxQGZwdC5lZHUudm4iLCJyb2xlIjoiQkVORUZJQ0lBUlkiLCJpYXQiOjE3OTI2MDY5NTksImV4cCI6MTc5MjY5MzM1OX0.lXrciMCe0cIKgO5rW3WXQN4yit2M-A7cW9LgdKpi50o';

const dashRes = await fetch('http://localhost:8080/api/v1/handover/executor/dashboard', {
  headers: { Authorization: `Bearer ${token}` }
});
const dash = await dashRes.json();
console.log('Dash cases count:', dash.cases?.length);

for (const c of dash.cases || []) {
  const dRes = await fetch(`http://localhost:8080/api/v1/handover/cases/${c.case_id}/details`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const d = await dRes.json();
  console.log('Details:', d);
}
