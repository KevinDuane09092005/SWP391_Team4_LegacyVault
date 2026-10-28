# Local frontend/backend integration test

## Start the backend

The backend expects MySQL at `localhost:3306`, with database `legacy_vault_db` by default. Create that database and start MySQL first. In the backend terminal, set local-only values before running Spring Boot:

```sql
CREATE DATABASE legacy_vault_db;
```

```powershell
$env:SPRING_DATASOURCE_USERNAME = 'root'
$env:SPRING_DATASOURCE_PASSWORD = 'your-local-mysql-password'
$env:JWT_SECRET = 'replace-with-a-random-secret-at-least-32-characters-long'
$env:ENCRYPTION_SECRET_KEY = 'replace-with-a-local-encryption-secret'
$env:ADMIN_BOOTSTRAP_ENABLED = 'true'
$env:ADMIN_BOOTSTRAP_EMAIL = 'admin@example.test'
$env:ADMIN_BOOTSTRAP_PASSWORD = 'choose-a-local-password-at-least-16-characters'
.\mvnw.cmd spring-boot:run
```

Keep those values on your machine; do not commit them. The admin bootstrap account is created only if that email does not already exist. After its first successful creation, set `ADMIN_BOOTSTRAP_ENABLED=false` for later runs. The backend may create the schema tables through its configured JPA setting.

## Start the frontend

In the frontend terminal, copy `.env.example` to `.env` if needed and keep `VITE_DEMO_MODE=false`. Leave `VITE_API_BASE_URL` blank to use the configured Vite proxy to `http://localhost:8080`.

```powershell
npm ci
npm run dev
```

Open the Vite URL printed in the terminal.

## Check the connected flows

1. Open `/pricing`. The plan cards should load from `GET /api/v1/plans`.
2. Choose a plan and register with an email. The current backend returns a test OTP in its registration response; enter it before it expires, then sign in.
3. For a paid plan, registration does not charge anything. After verification and sign-in, the selected plan opens in **Plan & billing**. Add a simulated payment method using only a fake last-four value (never enter a real card number or CVV), confirm recurring billing, and submit checkout.
4. To test a declined payment, add another simulated method with **Simulate a declined transaction** checked, select it, and retry checkout. The backend's mock gateway never charges money.
5. Sign in with the locally bootstrapped admin account to test user listing, role/status changes, and audit logs. These requests require an admin JWT.

## Current limitations

- OTP resend and password reset endpoints are not present in the backend, so the frontend reports that instead of pretending a request succeeded.
- Admin role/permission matrix, policy settings, and integration toggles are still frontend prototypes; their pages are marked as unconnected and edits are disabled in backend mode.
- The payment gateway is intentionally simulated. This is for functional coursework testing, not real billing.
- The JWT is stored in browser storage for this prototype. A production system should use a server-managed secure, httpOnly session.
