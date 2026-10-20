# LegacyVault – Flow 5: Legal Verification

Standalone **React + Vite** frontend based on the two supplied Figma screenshots and `legacyvault-legal-verification-flow5.yaml`.

## Run on Windows / VS Code

```powershell
cd flow-5
npm install
npm run dev
```

If PowerShell does not recognize npm, use:

```powershell
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Visit the localhost address printed by Vite. Run `npm run build` to compile and `npm test` to test business rules.

## Screens and interactions

| Screen | Origin | Action |
|---|---|---|
| Verification Queue | Figma Flow 5 | Select case, view detail, search/filter, start review |
| Approved Case Detail | Figma Flow 5b | Success confirmation (from API only in real mode) |
| Reject Case dialog + rejected detail | Required by `POST .../reject` | Enter reason and show rejection |
| Approve & Sign dialog | Required by `POST .../approve` | Optional note/PIN, confirmation |
| Verified History | Figma sidebar + queue API | View approved/rejected cases |
| Executor submission | `POST .../documents` | Validate and upload PDF/PNG/JPG up to 15 MB |
| Settings | Figma sidebar (no settings API) | Read-only API integration notes; reset demo data |
| Document preview | File detail API | Open backend-authorized protected document URL; demo metadata only |

**`New review`** selects the first available reviewable case in the current queue. New cases are created by the preceding DMS/Handover process (Flow 4), not by the verifier; no fake case-creation API was invented.

## Data and backend integration

By default, `VITE_DEMO_MODE=true` runs locally with the Figma sample data. The actions are simulated **and cannot issue real signatures, vault unlock tokens, or notifications**. Demo status changes and document metadata are saved in `localStorage`; no document bytes are persisted. The example dates are fixed **Figma fixture dates**, not today's date.

To use your group's backend, create a `.env` from `.env.example`:

```env
VITE_DEMO_MODE=false
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

`https://api.legacyvault.io/v1` in the YAML is an example contract server, not confirmed deployed. Do not treat it as a working endpoint.

Configure your own authentication layer by calling `configureTokenProvider(() => currentJWT)` from `src/api.js` after login is integrated. Requests require an access token. **Never store passwords, tokens or private keys in Vite environment variables.** The backend must authorize each action independently.

APIs used:

- `GET /legal-verification/verifier/queue?status=&search=&page=&size=`
- `GET /legal-verification/cases/{caseId}`
- `POST /legal-verification/cases/{caseId}/approve` (`signature_note`, `verifier_pin` optional)
- `POST /legal-verification/cases/{caseId}/reject` (`reason` required)
- `POST /legal-verification/cases/{caseId}/documents` (`multipart/form-data`, `file`)

**Contract gap:** The YAML describes Executor **submitting** a case for verification but defines **only document upload**. Backend needs to define a submission endpoint; frontend intentionally does not present an ungrounded live submit action.

**Security:** The Legal Verifier and Executor are different roles. The Executor page uses a known Case ID; it does not call the verifier-only queue endpoint. Do not confuse an on-screen `APPROVED` status with actual legal compliance. Vault unlock requires independent backend checks, signing and authorization.

## GitHub and integration

Upload the complete `flow-5/` folder to your flow branch **without** `node_modules/` or `dist/`. This standalone Vite app will need component/routing/CSS integration to become part of the 7-flow application. Do not overwrite the main repo's root `src/` or `package.json`.

## YAML syntax repair

The supplied YAML could not be parsed as-is because the `description` on original line 120 contained an unquoted `vd: LV-1042`. The included `api-specs/legacyvault-legal-verification-flow5.yaml` changes **only that line** by quoting the description, with no endpoint or schema changes. Validated using PyYAML.
