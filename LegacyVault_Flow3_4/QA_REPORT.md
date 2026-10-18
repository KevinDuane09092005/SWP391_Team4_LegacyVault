# LegacyVault Flow 3 / 4 — QA results

## Tested on revised source

- **Flow 3 — 12/12 rule tests passed** (`flow-3/tests/assignmentRules.test.mjs`): multi-asset inputs; empty asset/beneficiary/executor/instructions; Executor–Beneficiary conflict; missing/negative/decimal/out-of-range percentages; sum not 100%; deleted contact references; local demo serialization.
- **Flow 4 — 13/13 rule tests passed** (`flow-4/tests/dmsLogic.test.mjs`): unconfigured; monitoring; due soon and 3-day boundary; grace period; expired grace / triggered; authoritative Backend statuses; unavailable/inconsistent Backend status handling.
- **JSX syntax parsing passed** for both main.jsx files (TypeScript compiler parser).
- **Component smoke tests passed** using a lightweight React hook/render simulation (no browser): Flow 3 Contact Book → four-step wizard → local save; Flow 4 config / monitoring / due soon / grace warning / triggered with simulated dates.
- **Packaging checked**: no `node_modules`, `dist` or `.env` files.

## Limitations

- **A full `npm run build` with Vite could not be run in this environment.** `npm install` could not reach npm registry, and the user's uploaded `node_modules` contains Windows native binaries that cannot run here. Run `npm install` and `npm run build` locally on Windows to verify the actual bundle; use `npm run test:logic` for the included tests.
- No Backend is connected here. Case creation, notification delivery, RBAC and legal verification were NOT tested end-to-end.
- **Flow 3 API incompatibility remains**: original YAML only accepts `asset_id` and free-text split instructions. See `API_ALIGNMENT_REQUIRED.md`. This mismatch is not solvable by Frontend validation alone.

## Design limitations intentionally preserved

- In a Frontend-only demo, Flow 4 timestamps are simulated and persisted in localStorage. The TRIGGERED page must not imply that Backend created a real Handover Case or notified Executor.
- Backend mode uses statuses `active`, `warning`, `triggered` and `next_check_in_at`. The UI treats connection/status errors as unknown rather than trusting local estimates.
