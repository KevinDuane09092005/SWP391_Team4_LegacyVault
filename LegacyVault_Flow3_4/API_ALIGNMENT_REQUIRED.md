# LegacyVault: Required Frontend / API alignment

## Flow 3 – production integration is blocked until API and Database changes

The original `flow-3/api-specs/legacyvault-contacts-assignments-api-flow3.yaml` defines **one `asset_id` per assignment** (not multiple `asset_ids`) and `beneficiary_contact_ids` without structured percentage allocations. Allocation percentages are described as free text in `handover_instructions`; the spec explicitly says the Backend cannot validate the sum.

The updated Flow 3 frontend supports group selection (multiple assets) and numeric beneficiary allocations summing to 100%. The group must **agree on a new API and DB contract**, for example `asset_ids: UUID[]` plus `beneficiaries: [{contact_id: UUID, split_percentage: number}]` or atomic creation of one assignment per selected asset. Backend must independently validate ownership, IDs, conflicting role restrictions, and allocations (100% per asset).

Existing YAML is preserved, NOT silently updated or misrepresented. No call to `/assignments` is made by Flow 3; assignments are stored in browser localStorage for demo purposes only. No real notifications/invitations or encryption occur.

## Flow 4 – status API semantics

The current Flow 4 YAML statuses are **lowercase `active`, `warning`, `triggered`**. UI state "Due Soon" is calculated when Backend status is `active` and fewer than 3 days remain until `next_check_in_at`. `warning` means in Grace Period, not Due Soon. Backend controls triggering.

Frontend calls GET `/dms/config`, PUT `/dms/config`, GET `/dms/status`, POST `/dms/checkin` and GET `/dms/checkin-logs` when an API base URL is configured. A 409 means a triggered DMS cannot be reset by check-in. The triggered API status does not itself provide `handover_case_id` or notification-delivery confirmation; the UI does not claim these are confirmed.

Local fallback without `VITE_API_BASE_URL` is only a browser demo: it cannot create Handover Cases or send notification emails. Do not use it to make any real authorization decision.

## Security and deployment

Do not put credentials, session tokens, encryption keys or private information in committed source or any `VITE_*` env variables (Vite exposes them in the browser). A simple localStorage token key `legacyvault-access-token` is used solely as an API integration placeholder; the team must substitute real secure authentication in production. Actual authorization, encryption, state transitions, and legal approval are handled by Backend.
