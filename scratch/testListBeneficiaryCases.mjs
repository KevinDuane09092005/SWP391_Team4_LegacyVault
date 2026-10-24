import { setDemoMode } from '../src/services/apiClient.js';
setDemoMode(false);

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

const { listBeneficiaryCases, getBeneficiaryCase } = await import('../src/services/handoverService.js');

console.log('Testing listBeneficiaryCases...');
const cases = await listBeneficiaryCases(user);
console.log('Returned cases:', JSON.stringify(cases, null, 2));

if (cases.length > 0) {
  console.log('Testing getBeneficiaryCase for case:', cases[0].id);
  const detail = await getBeneficiaryCase(user, cases[0].id);
  console.log('Case detail:', JSON.stringify(detail, null, 2));
}
