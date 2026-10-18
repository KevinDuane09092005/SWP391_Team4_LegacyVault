# Flow 4 – Dead Man's Switch

Run `npm install && npm run dev`. Pure rule tests: `npm run test:logic`.

Screens change automatically: configured, monitoring, due soon, grace warning, triggered. Without API URL all timings are **local simulation only**. For a real Backend set `VITE_API_BASE_URL` (server /v1 prefix) in a local uncommitted `.env`. APIs used: GET/PUT /dms/config, GET /dms/status, POST /dms/checkin, GET /dms/checkin-logs.

API authentication is a placeholder using localStorage key `legacyvault-access-token`; replace before deployment. Backend owns the scheduler, case creation, notifications, and all authorization. `TRIGGERED` does not mean that case creation or notification delivery was independently confirmed by this UI.

## Test all local demo states without waiting months

1. Open Flow 4, save configuration with interval = 90 days and grace = 14 days.
2. In browser Developer Tools → Console, change the last check-in date, then reload:

```js
// Due soon (2 days remaining):
localStorage.setItem('legacyvault-dms-lastcheck', new Date(Date.now()-88*86400000).toISOString()); location.reload();
// Grace warning (deadline passed 5 days ago):
localStorage.setItem('legacyvault-dms-lastcheck', new Date(Date.now()-95*86400000).toISOString()); location.reload();
// Triggered (deadline + grace both passed):
localStorage.setItem('legacyvault-dms-lastcheck', new Date(Date.now()-120*86400000).toISOString()); location.reload();
```

These are simulation states only. Never use browser storage to control a real Dead Man's Switch.
