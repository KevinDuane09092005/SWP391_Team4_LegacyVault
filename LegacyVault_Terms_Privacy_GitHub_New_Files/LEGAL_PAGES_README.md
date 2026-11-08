# LegacyVault — Terms of Service & Privacy Policy (EN / VI)

These **user-facing legal page drafts** are integrated into the existing LegacyVault React/Vite app, not separate websites.

## Routes and placement

| Page | Existing URL | Friendly URL |
| --- | --- | --- |
| Terms of Service | `/terms` | `/terms-of-service` |
| Privacy Policy | `/privacy` | `/privacy-policy` |

The registration screen already links to `/terms` and `/privacy`; these routes now render real pages instead of placeholders. The landing-page footer includes both documents in English and Vietnamese.

## Editable source files

- `src/pages/LegalDocumentPage.jsx` — reusable responsive view, table of contents, language switch, theme switch, print/PDF.
- `src/data/legalContent.js` — all English and Vietnamese user-facing text (12 Terms sections, 13 Privacy sections).
- `src/styles/legal-pages.css` — isolated styling based on global design tokens; dark mode and print styles.
- `src/App.jsx` — four public routes (two aliases).
- `src/data/landingContent.js` — Terms footer link in English and Vietnamese.
- `tests/legal-pages.test.mjs` — content and integration checks.

## Language behavior

The page uses the project's existing `LanguageProvider`. The EN / VI switch controls the **entire document** and stores the choice through the existing `legacyvault.language` browser preference. No separate translation context or extra dependency is added.

## Run locally (Windows)

From the **main repository root** (not `src/`):

```powershell
npm install
npm run dev
```

Open `/terms` and `/privacy` in the local site. Verify EN/VI, theme, table-of-contents anchors, print, mobile viewport, and registration/footer links. Run `node --test tests/legal-pages.test.mjs` for automated checks and `npm run build` to validate the integration. No live API is required to display these documents.

## GitHub web upload / branch workflow

1. Create `feature/legal-pages` from the latest **main** on GitHub.
2. Upload **new files only** into the matching folders: `src/pages/LegalDocumentPage.jsx`, `src/data/legalContent.js`, `src/styles/legal-pages.css`, `tests/legal-pages.test.mjs`, and `LEGAL_PAGES_README.md`.
3. Carefully edit **existing** `src/App.jsx` and `src/data/landingContent.js` on this branch. Compare with the patch versions; do not blindly overwrite the latest team version.
4. Commit the branch, run tests locally, open a Pull Request into `main`, review before merging.

## IMPORTANT — legal and privacy review before production

These documents are **Draft 0.1, not effective terms or a final compliance guarantee**. They were written for the LegacyVault student project and are intended to be understandable to end users. Before real deployment, obtain legal review and **confirm/insert**:

- Legal identity and official contact details of the operator.
- Effective date, versioning and notification process for changes.
- Exact data categories, lawful basis, processors/subprocessors, countries of processing, and retention periods.
- Mechanisms to handle privacy requests, consent (separate where required), revocation and deletion.
- Implemented encryption, RBAC, audit, notification, KYC and AI provider controls.
- Any payment/refund terms, service termination, liability terms and dispute channel.

The existing Register checkbox was not changed. Rendering legal pages is not the same as building server-side, versioned consent records. Add backend consent tracking only after an API contract is agreed. Never claim user data is not stored or transferred without verifying actual operations.

Reference legislation to review includes Vietnam's Civil Code 2015, Electronic Transactions Law 2023, Personal Data Protection Law 2025 and Decree 356/2025/NĐ-CP (effective 01 Jan 2026).
