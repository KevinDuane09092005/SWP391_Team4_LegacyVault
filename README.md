# LegacyVault — Frontend

Frontend prototype for **LegacyVault — Digital Legacy Management and Digital Asset Handover System** (university project).

Built with **React**, **Vite**, **JavaScript**, plain **CSS**, and **React Router**.

> **Prototype notice:** this is a university project. The frontend can use the Spring Boot backend or demo data,
> depending on configuration. The chatbot conversation stays in browser memory; in API mode, messages are sent
> to the authenticated backend for an AI reply and are not stored by the chatbot feature. Never enter passwords,
> OTPs, recovery phrases, or private keys in the chat.

## Requirements

- [Node.js](https://nodejs.org/) 20.19 or newer (includes npm)

Check your versions:

```bash
node -v
npm -v
```

## Getting started

Open a terminal in this folder (`C:\Users\User\Documents\LegacyVault`) and run:

```bash
npm install      # first time only: downloads the dependencies into node_modules
npm run dev      # starts the development server
```

Then open the address printed in the terminal (usually <http://localhost:5173>).
Press `Ctrl + C` in the terminal to stop the server.

## Available scripts

| Command           | What it does                                               |
| ----------------- | ---------------------------------------------------------- |
| `npm run dev`     | Starts the development server with live reload             |
| `npm run build`   | Builds an optimised production version into `dist/`        |
| `npm run preview` | Serves the `dist/` build locally to check it               |
| `npm run lint`    | Checks the code with ESLint                                |

## AI assistant integration

The floating assistant is available on signed-in `/dashboard/...` pages. It has two modes:

- `VITE_CHAT_API_MODE=demo` uses curated local sample replies and does not call the backend.
- `VITE_CHAT_API_MODE=api` calls `POST /api/v1/chatbot/suggestions` and
  `POST /api/v1/chatbot/message` through the existing API client (including the signed-in token).

To connect it to the Spring Boot chatbot, copy `.env.example` to `.env.local`, keep
`VITE_CHAT_API_MODE=api`, and run the backend on `http://localhost:8080` (the Vite proxy target).
Configure `OPENAI_API_KEY` only in the backend environment. Do not place provider credentials in any
`VITE_...` variable or frontend file. Without a backend key, the backend returns a clear “AI not configured”
message; suggested questions remain locally available from the backend FAQ endpoint.

Run the chatbot contract checks with:

```bash
node --test tests/ai-chat.test.mjs
```

## Project structure

```
LegacyVault/
├─ index.html                 # HTML shell; React mounts into <div id="root">
├─ public/favicon.svg         # Browser tab icon
├─ src/
│  ├─ main.jsx                # Starts React and the router
│  ├─ App.jsx                 # List of routes (pages)
│  ├─ components/             # Reusable building blocks
│  │  ├─ Brand.jsx            # Logo + name
│  │  ├─ Button.jsx           # Primary / secondary / link buttons
│  │  ├─ Icon.jsx             # Inline SVG icons
│  │  ├─ ScrollToTop.jsx      # Scrolls to the top when the page changes
│  │  ├─ SmartLink.jsx        # Router link or in-page anchor
│  │  └─ landing/             # One component per landing-page section
│  ├─ data/
│  │  └─ landingContent.js    # All landing-page text
│  ├─ pages/
│  │  ├─ LandingPage.jsx      # Puts the landing sections together
│  │  └─ PlaceholderPage.jsx  # Temporary page for routes not built yet
│  └─ styles/
│     ├─ global.css           # Colours, fonts, buttons, cards (design tokens)
│     ├─ landing.css          # Landing-page layout and responsive rules
│     └─ placeholder.css      # Placeholder page styles
```

## Pages

| Route       | Status                                                 |
| ----------- | ------------------------------------------------------ |
| `/`         | Landing page — complete                                |
| `/login`    | Placeholder (Sign In) — planned for Stage 4            |
| `/register` | Placeholder (Get Started / Create your vault) — Stage 4 |
| `/pricing`  | Placeholder (Compare plans) — no prices or payments    |
| `/privacy`  | Placeholder                                            |
| `/contact`  | Placeholder                                            |

## Roadmap

Planned internal pages (frontend only, using mock data kept in `src/data/` and accessed through
`src/services/` so they can later be swapped for real API calls):

Login, Register, Dashboard, My Vault, Digital Asset Management, Beneficiary Management,
Executor Management, Legal Documents, Dead Man's Switch Settings, Legal Verification,
Asset Handover, Notifications, and Admin Dashboard.

Role selection (Vault Owner, Digital Executor / Trustee, Beneficiary, Legal Verifier / Notary,
System Administrator) will be a **demo switch only** — it is not a security or permission system.
