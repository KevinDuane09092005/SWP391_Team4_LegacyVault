# How to upload LegacyVault legal pages to GitHub (web browser, no Git terminal)

Repository: `KevinDuane09092005/SWP391_Team4_LegacyVault`

## 1. Create a new branch from the latest `main`

Open the repository's **Code** page on GitHub, select branch **main** then **View all branches → New branch**. Enter `feature/terms-privacy`, set the **Source** to `main`, and create the branch. Do not work directly on `main`.

## 2. Upload these NEW files (do not upload the patch's wrapper folder)

The ZIP contains only new files. Place each file at the exact repository path:

| File to upload | Open this repository folder first |
| --- | --- |
| `src/pages/LegalDocumentPage.jsx` | `src/pages` |
| `src/data/legalContent.js` | `src/data` |
| `src/styles/legal-pages.css` | `src/styles` |
| `tests/legal-pages.test.mjs` | `tests` |
| `LEGAL_PAGES_README.md` | repository root |

At the target folder, select **Add file → Upload files**, drag the named file (not the entire unzipped wrapper folder) and confirm the path is correct. Commit directly to `feature/terms-privacy`.

## 3. Edit two EXISTING files on the new branch — do not upload/overwrite them

### `src/App.jsx`

Add to the import group:

```jsx
import LegalDocumentPage from './pages/LegalDocumentPage.jsx'
```

Replace only these two existing placeholder routes:

```jsx
<Route path="/terms" element={<PlaceholderPage page="terms" />} />
<Route path="/privacy" element={<PlaceholderPage page="privacy" />} />
```

with:

```jsx
<Route path="/terms" element={<LegalDocumentPage kind="terms" />} />
<Route path="/terms-of-service" element={<LegalDocumentPage kind="terms" />} />
<Route path="/privacy" element={<LegalDocumentPage kind="privacy" />} />
<Route path="/privacy-policy" element={<LegalDocumentPage kind="privacy" />} />
```

Leave all other routes, including Flow 1–7, unchanged. Commit this edit.

### `src/data/landingContent.js`

In the `footer.links` list for English, add:

```js
{ label: 'Terms', to: '/terms' },
```

before the existing `{ label: 'Privacy', to: '/privacy' }`.

In the Vietnamese `footer.links`, add:

```js
{ label: 'Điều khoản', to: '/terms' },
```

before the existing `{ label: 'Quyền riêng tư', to: '/privacy' }`.

Commit this edit. The Register page already links to `/terms` and `/privacy`: no changes needed there.

## 4. Check and submit a Pull Request

On a local clone or an extracted copy of the **full integrated** project, run:

```powershell
npm install
node --test tests/legal-pages.test.mjs
npm run build
npm run dev
```

Check all of the following:

- `/terms` and `/privacy` render user-readable legal documents.
- `/terms-of-service` and `/privacy-policy` render the same documents.
- EN / VI switches every heading and paragraph and remembers the preference.
- The theme switch, section links, mobile layout, print, registration links, and landing footer work.
- Dashboard and other flows remain accessible.

When ready, open **Pull requests → New pull request**, choose `base: main`, `compare: feature/terms-privacy`, review the changes and create the PR. Have a teammate approve before merging.

## Important

The texts are user-facing **legal drafts**, not finalized legal instruments. They deliberately do not invent a real business operator, address, actual retention schedule, production data processor, or legally binding effective date. Confirm those details with the team and legal advisor before production.
