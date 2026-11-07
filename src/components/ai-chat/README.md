# LegacyVault Floating AI Chatbot – OpenAPI 0.2.0 Integration

The floating assistant is mounted in `src/App.jsx`, visible for signed-in users on `/dashboard*`. It inherits the application's `LanguageContext` and theme, keeps its transcript only in React memory (no localStorage, no automatic persistence), and does not access private assets or vault records.

## API endpoints

In API mode, the browser uses the existing `src/services/apiClient.js` to attach the authenticated Bearer token and the configured `VITE_API_BASE_URL` / Vite proxy:

- `POST /api/v1/chatbot/suggestions` — `{ "query": "", "language": "vi" }` to load starter prompts; when typing, sends partial text (max 200 chars), debounced by 250 ms. Response: `{ "suggestions": ["..."] }` (up to five prompts).
- `POST /api/v1/chatbot/message` — `{ "message": "...", "language": "vi", "history": [{"role":"user", "content":"..."}] }`. Message max 1000 chars, history max 8 *previous* user/assistant turns, each content max 1500 chars; no `role`, token, or private account data in the JSON body. Response includes `reply`, `topic`, `status` (`ANSWERED`, `CLARIFICATION_NEEDED`, `OUT_OF_SCOPE`), and up to 3 follow-up `suggestions`.

**Source specification:** `legacyvault-chatbot-openapi.yaml` at repository root.

Backend must derive role from the authenticated session; never trust a role supplied by browser data. Only the backend talks to the AI provider, using locally maintained LegacyVault help content. The API must not read or modify account, asset or vault data. Provider processing is governed by the provider's terms, even though the backend doesn't persist chat history.

## Demo vs real backend

Create your own local `.env` from `.env.example`:

```dotenv
VITE_DEMO_MODE=false
VITE_API_BASE_URL=
VITE_CHAT_API_MODE=api
```

The root `vite.config.js` forwards `/api` to `http://localhost:8080` (the backend should implement `/api/v1/chatbot/...` and accept the application's JWT). Restart Vite after changing `.env`.

Use `VITE_CHAT_API_MODE=demo` without the backend; this uses deterministic, in-app sample answers and locally filtered prompts. **Demo is not a real AI model.** The mode is independent of `VITE_DEMO_MODE`, which controls the rest of LegacyVault.

## Privacy, safety, and failures

- No AI provider key in frontend. The UI renders plain-text replies with React (no unsafe HTML).
- The UI warns against sending passwords, OTPs, identity numbers, wallet secrets, and private vault content. It also blocks obvious patterns; server-side rules are still required.
- Only the latest eight prior user/assistant turns are sent; unanswered/failed submissions are excluded. Conversation is reset by refresh or sign-out.
- Handles `400` (validation), `401` (expired login), `429` (rate limit), `502` (AI provider unavailable), and `500` (server). Failed suggestion lookups do not block messages.
- The assistant is not a legal adviser and must not claim to approve inheritance, unlock assets, or access private records.

## Run & test

From the repository root:

```bash
npm install
node --test tests/ai-chat.test.mjs tests/ai-chat-api.test.mjs
npm run build
npm run dev
```

Sign in, open a dashboard page, and click the chat button in the bottom right. Change the global EN/VI language toggle and try questions. In real mode verify the Network tab shows the two `POST /api/v1/chatbot/...` requests and Bearer JWT; if you get 401, sign in via the real backend (not a mock login).
