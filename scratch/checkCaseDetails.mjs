const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzMzMzMzMzMy0zMzMzLTMzMzMtMzMzMy0zMzMzMzMzMzMzMzMiLCJlbWFpbCI6IlNpbmhMTFNFMTcxNzYxQGZwdC5lZHUudm4iLCJyb2xlIjoiQkVORUZJQ0lBUlkiLCJpYXQiOjE3OTI2MDY5NTksImV4cCI6MTc5MjY5MzM1OX0.lXrciMCe0cIKgO5rW3WXQN4yit2M-A7cW9LgdKpi50o';

const caseId = '1b2c2020-af33-492e-b313-d6b0eaef3753';
const r = await fetch(`http://localhost:8080/api/v1/handover/cases/${caseId}/details`, {
  headers: { Authorization: `Bearer ${token}` }
});
console.log(`[${r.status}] details:`);
const data = await r.json();
console.log(JSON.stringify(data, null, 2));
