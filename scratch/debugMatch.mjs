import { apiFetch } from '../src/services/apiClient.js';

const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzMzMzMzMzMy0zMzMzLTMzMzMtMzMzMy0zMzMzMzMzMzMzMzMiLCJlbWFpbCI6IlNpbmhMTFNFMTcxNzYxQGZwdC5lZHUudm4iLCJyb2xlIjoiQkVORUZJQ0lBUlkiLCJpYXQiOjE3OTI2MDY5NTksImV4cCI6MTc5MjY5MzM1OX0.lXrciMCe0cIKgO5rW3WXQN4yit2M-A7cW9LgdKpi50o';

globalThis.localStorage = {
  getItem: (k) => (k === 'token' ? token : null),
  setItem: () => {},
  removeItem: () => {},
};

const user = {
  id: '33333333-3333-3333-3333-333333333333',
  identifier: 'SinhLLSE171761@fpt.edu.vn',
  fullName: 'SinhLLSE171761',
  role: 'BENEFICIARY'
};

const dash = await apiFetch('/handover/executor/dashboard');
console.log('dash cases:', dash.cases);

for (const c of dash.cases || []) {
  const d = await apiFetch(`/handover/cases/${encodeURIComponent(c.case_id)}/details`);
  console.log('c:', c);
  console.log('d:', d);
  const bEmail = d.primary_beneficiary?.email || '';
  const bName = d.primary_beneficiary?.name || c.beneficiary || '';
  const userPrefix = (user?.identifier || user?.email || '').split('@')[0].toLowerCase();
  console.log('bEmail:', bEmail, 'bName:', bName, 'userPrefix:', userPrefix);

  const isMatch = !userPrefix ||
    bEmail.toLowerCase().includes(userPrefix) ||
    bName.toLowerCase().includes(userPrefix) ||
    (user?.fullName && bName.toLowerCase().includes(user.fullName.toLowerCase()));
  console.log('isMatch:', isMatch);
}
