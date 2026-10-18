# LegacyVault – Flow 3 and Flow 4 Frontend

Two independent React/Vite apps:

- **flow-3/** Contacts and 4-step Assignment Wizard; multi-asset selection, allocation %, inline validation, review and **browser-local demo save only**.
- **flow-4/** Dead Man's Switch configuration, monitoring, due-soon, grace warning and triggered. Screens transition automatically from the timer in demo mode or the authoritative API status when configured.

### Run each app

Open a flow folder and run `npm install` followed by `npm run dev` (on Windows where npm is not on PATH: `& "C:\Program Files\nodejs\npm.cmd" install` and `& "C:\Program Files\nodejs\npm.cmd" run dev`).

Run rule tests with `npm run test:logic` or `node --test tests/*.test.mjs` from each flow folder. The ZIP omits `node_modules` and build outputs.

**Read `API_ALIGNMENT_REQUIRED.md` before Backend integration.** The provided Flow 3 YAML is incompatible with the newly requested group selection and structured allocations. Flow 4 API mode requires `VITE_API_BASE_URL` in a local `.env`, valid credentials, and server implementation of the supplied API; otherwise it is a simulation only.
