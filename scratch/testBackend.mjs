const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'SinhLLSE171761@fpt.edu.vn', password: 'Demo@1234' })
});

console.log('Login status:', loginRes.status);
const loginData = await loginRes.json();
console.log('Login data:', loginData);

if (loginData.token) {
  const token = loginData.token;
  const headers = { Authorization: `Bearer ${token}` };

  // Try fetching swagger docs
  const swaggerRes = await fetch('http://localhost:8080/v3/api-docs', { headers });
  console.log('Swagger status:', swaggerRes.status);
  if (swaggerRes.ok) {
    const swagger = await swaggerRes.json();
    console.log('API Paths in Backend:');
    const paths = Object.keys(swagger.paths || {});
    paths.filter(p => p.includes('handover') || p.includes('beneficiary')).forEach(p => console.log('  ', p));
  }
}
