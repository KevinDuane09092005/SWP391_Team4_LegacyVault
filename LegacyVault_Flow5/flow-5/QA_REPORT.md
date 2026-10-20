# Flow 5 – Quality check (2026-10-20)

## Source correspondence

- Queue and review detail match reference **Flow 5 – Legal Verification** (case LV-1042 under review, LV-1038 approved).
- Approved result matches **Flow 5b – Legal Verification (Approved)** (success card and status).
- Additional necessary UI from YAML: Reject reason dialog, approval confirmation with optional fields, Executor document upload.
- Sidebar-specified UI: Verified History and Settings. Settings is read-only, as no backend Settings API is defined.
- Extra UI for practical completeness: document preview fallback, loading/empty/error states, search/status filters.

## Automated checks

- `npm test`: **7/7 passed** (business validation + simulated mock API transitions, pagination and upload).
- TypeScript parser: **0 parsing errors** in React JSX / API / fixtures / rules.
- OpenAPI YAML: validated by PyYAML after one line (description of `caseId`) was quoted.
- Full `npm run build`: **NOT VERIFIED in this container**. Runtime environment is Linux, whereas pre-existing npm dependency archive was Windows-specific, and npm registry access was unavailable (`EAI_AGAIN`). No successful build is claimed. Install dependencies normally on Windows and run `npm run build` before merging.

## Known integration boundaries

- Default data is a demo only, no actual digital signature or legal approval.
- User authentication/role checking must be integrated in the main app. Backend must implement RBAC checks.
- The YAML defines document upload but does not define a request-to-submit-for-review endpoint.
- Backend must validate PDFs/attachments, file sizes, document privacy, legal eligibility and JWT independently.
- Browser preview requires a working, access-controlled document URL from the backend; demo contains metadata only.
