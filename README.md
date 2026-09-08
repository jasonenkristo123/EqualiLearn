# EqualiLearn

**An inclusive, accessibility-first learning platform.** EqualiLearn turns lectures and
study materials into formats that work for every learner — live speech-to-text
transcription, AI document narration, distraction-free concept mapping, and a
collaborative discussion room that ties the accessibility tools together.

The app is a **Next.js 16 (App Router) frontend** that talks to a separate backend API
over REST and WebSockets. This repository contains the frontend only.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Install](#1-install)
  - [2. Environment variables](#2-environment-variables)
  - [3. Run the dev server](#3-run-the-dev-server)
  - [4. Other scripts](#4-other-scripts)
- [How the frontend talks to the backend](#how-the-frontend-talks-to-the-backend)
  - [REST (the `/api` proxy)](#rest-the-api-proxy)
  - [Authentication & the session cookie](#authentication--the-session-cookie)
  - [WebSockets](#websockets)
  - [Route protection](#route-protection)
  - [Backend endpoints used](#backend-endpoints-used)
- [Project structure](#project-structure)
- [User flow](#user-flow)
  - [0. First contact — landing page](#0-first-contact--landing-page)
  - [1. Register](#1-register)
  - [2. Log in](#2-log-in)
  - [3. Google sign-in](#3-google-sign-in)
  - [4. Landing in the app — Dashboard](#4-landing-in-the-app--dashboard)
  - [5. Live Transcribe](#5-live-transcribe)
  - [6. PPT Reader (PPT → Audio)](#6-ppt-reader-ppt--audio)
  - [7. Kanvas Pikir (mind map)](#7-kanvas-pikir-mind-map)
  - [8. Ruang Lingkar (group discussion)](#8-ruang-lingkar-group-discussion)
  - [9. Theme toggle](#9-theme-toggle)
  - [10. Log out](#10-log-out)
- [Development notes](#development-notes)
- [Build & deploy](#build--deploy)
- [Troubleshooting](#troubleshooting)

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | **Next.js 16.3** (App Router, Turbopack, React Compiler enabled) |
| UI runtime | **React 19.2** |
| Language | **TypeScript 5** (`strict`) |
| Styling | **Tailwind CSS v4** (`@import "tailwindcss"`), `tw-animate-css` |
| Components | **shadcn** (`base-vega` style) on top of **@base-ui/react**, **lucide-react** icons |
| Server state | **TanStack Query v5** (`@tanstack/react-query`) |
| Client state | **Zustand v5** (mind map canvas store) |
| Forms & validation | **react-hook-form** + **Zod v4** (auth forms) |
| HTTP | **Axios** (single shared instance with interceptors) |
| Mind map canvas | **@xyflow/react** |
| Animation | **GSAP** (landing page, respects `prefers-reduced-motion`) |
| Notifications | **react-toastify**, **sweetalert2** (logout confirmation) |
| Audio capture | Web Audio **AudioWorklet** (`public/worklets/pcm16-capture-processor.js`) |
| Tooling | **Biome 2** (lint + format), **Lefthook** (git hooks) |

There is **no test suite** in this repo yet. `tsc --noEmit`, `biome check`, and
`next build` are the safety net.

---

## Prerequisites

- **Node.js 20.9+** (Node 22 LTS recommended — Next.js 16 requires a modern Node).
- **npm** (a `package-lock.json` is committed; use npm for reproducible installs).
- Network access to the backend API (see [Environment variables](#2-environment-variables)).
- A Chromium-based or Firefox browser with **microphone permission** for the
  Live Transcribe feature.

---

## Setup

### 1. Install

```bash
git clone <this-repo>
cd equalilearn
npm install
```

`npm install` also runs `npm run prepare`, which installs the **Lefthook** git hooks
(pre-commit `biome check --write` on staged files + `tsc --noEmit`).

### 2. Environment variables

Create a **`.env.local`** file in the project root. Only `NEXT_PUBLIC_BASE_API_URL`
is required.

```dotenv
# Required — base URL of the backend API, including any version path.
# Trailing slashes are trimmed automatically.
NEXT_PUBLIC_BASE_API_URL=https://equillearn.bccdev.id/api/v1/

# Optional — explicit WebSocket base for Live Transcribe (speech-to-text).
# If omitted, the socket URL is derived from NEXT_PUBLIC_BASE_API_URL
# (https:// → wss://, http:// → ws://) with the path `ws/speech-to-text`.
# NEXT_PUBLIC_WS_URL=wss://equillearn.bccdev.id/api/v1/ws/speech-to-text

# Optional — Google OAuth client id. The browser flow is a full-page redirect
# to `<origin>/api/auth/google/login` (the backend owns the OAuth exchange),
# so this is informational and not currently read by the frontend.
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_BASE_API_URL` | ✅ | `next.config.ts` (REST proxy), `useGroupChat` (chat WS), `getSpeechToTextUrl` (STT WS) | Include the version segment, e.g. `.../api/v1/`. Without it, **no `/api/*` rewrite is registered** and every API call 404s. |
| `NEXT_PUBLIC_WS_URL` | — | `getSpeechToTextUrl` | Overrides the derived speech-to-text socket URL. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | — | (none, currently) | Present in the sample env but not consumed by app code. |

> `.env*` is git-ignored. Never commit real credentials.

### 3. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>. The dev server uses Turbopack and hot-reloads on save.

Visiting `/` immediately redirects to `/home` (or to the Google callback if the URL
carries `?code=&state=`).

### 4. Other scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) on port 3000. |
| `npm run build` | Production build (`next build`, Turbopack). Also runs `tsc`. |
| `npm run start` | Serve the production build (run `build` first). |
| `npm run lint` | `biome check` — lint + format check (no writes). |
| `npm run format` | `biome format --write` — format the codebase in place. |
| `npm run prepare` | `lefthook install` — wire up git hooks (runs automatically on `npm install`). |

To auto-fix lint + import order across the repo: `npx biome check --write src`.

---

## How the frontend talks to the backend

### REST (the `/api` proxy)

All REST calls go through **one shared Axios instance** (`src/shared/lib/axios.ts`) with
`baseURL: "/api"`, so calls look like `api.get("groups")` → `/api/groups`.

`next.config.ts` rewrites `/api/:path*` to `${NEXT_PUBLIC_BASE_API_URL}/:path*`, so the
browser only ever hits the app's own origin (no CORS), and the Next server forwards to
the real API. Example:

```
api.get("history/all")
  → /api/history/all
  → https://equillearn.bccdev.id/api/v1/history/all
```

### Authentication & the session cookie

- The JWT is stored in a cookie named **`eql_access_token`** (`js-cookie`, 7-day
  expiry, `SameSite=Lax`, `Secure` in production) — see `src/shared/lib/token.ts` and
  `src/shared/lib/auth-cookie.ts`.
- The Axios **request interceptor** attaches `Authorization: Bearer <token>` to every
  request when a token is present.
- The Axios **response interceptor**:
  - on any response whose URL contains `auth/`, deep-scans the payload for
    `token` / `access_token` / `accessToken` and writes it to the cookie;
  - on any `401`, clears the cookie.
- There is no `/me` endpoint. "Is this message mine?" identity in the discussion room
  is derived from the JWT payload (`currentUser()` in
  `GroupDiscussion/service/groups.ts`) and, once connected, from the chat socket's
  `connected` frame.

### WebSockets

WebSockets connect **directly to the API host** (they bypass the Next.js `/api`
rewrite):

| Feature | URL | Auth |
| --- | --- | --- |
| Group chat | `wss://<api-host>/<version>/ws/chat?token=<JWT>&group_id=<uuid>` | token in query string (browsers can't set WS headers) |
| Live transcription | `wss://<api-host>/<version>/ws/speech-to-text?lang=<lang>` (or `NEXT_PUBLIC_WS_URL`) | — |

The chat wire protocol is documented in
`src/features/(main)/GroupDiscussion/service/chat-protocol.ts` and
`.../GroupDiscussion/BACKEND-CONTRACT.md`.

### Route protection

`src/proxy.ts` is the request middleware (Next.js 16 renamed the `middleware.ts`
convention to `proxy.ts`). It runs on:

- **Protected app routes** — `/dashboard`, `/live-transcribe`, `/ppt-audio`,
  `/ppt-canvas`, `/canvas-discussion`: no `eql_access_token` cookie →
  redirect to `/login?next=<path>`.
- **Auth routes** — `/login`, `/register`: already has a cookie → redirect to
  `/dashboard`.

### Backend endpoints used

| Feature | Method & path (relative to `NEXT_PUBLIC_BASE_API_URL`) |
| --- | --- |
| Register | `POST auth/register` |
| Login | `POST auth/login` |
| Google login (redirect) | `GET /api/auth/google/login` (full-page navigation) |
| Google callback | `GET auth/google/callback?code=&state=` |
| Logout | `POST auth/logout` |
| Dashboard history | `GET history/all?page=1&limit=50` |
| Delete a document/history row | `DELETE documents/{id}` |
| Summarize a document | `POST documents/summarize` (multipart: `file`, `language`, `detail_level`, `target_audience`, `save_to_history`) |
| Get a saved summary | `GET documents/{id}` |
| TTS voices | `GET speech/voices` |
| Synthesize narration | `POST speech/synthesize` (`{ text, voice, format: "mp3" }`, returns an audio blob) |
| TTS history | `GET speech/history?page=&limit=` |
| List groups | `GET groups?page=&limit=` |
| Create group | `POST groups` (`{ name, description, member_emails, member_user_ids }`) |
| Get group | `GET groups/{id}` |
| Group messages | `GET groups/{id}/messages?page=&limit=` |
| Add member | `POST groups/{id}/members` (`{ email, role: "member" }`) |
| Remove member | `DELETE groups/{id}/members/{userId}` |
| Chat realtime | `WS ws/chat` |
| Transcription realtime | `WS ws/speech-to-text` |

---

## Project structure

```
src/
├── app/                       # Next.js App Router — routing only, thin pages
│   ├── (landing-page)/         #   /home        → LandingLayout (Navbar + Footer)
│   ├── (auth)/                 #   /login /register /auth/google/callback
│   ├── (main)/                 #   /dashboard /live-transcribe /ppt-audio
│   │                           #   /ppt-canvas /canvas-discussion → MainLayout
│   ├── layout.tsx              #   root <html>, fonts, theme no-FOUC script, Providers
│   └── page.tsx                #   "/" → redirects to /home (or Google callback)
│
├── features/                   # One folder per product feature
│   ├── (auth)/
│   ├── landing-page/
│   └── (main)/
│       ├── Dashboard/
│       ├── LiveTranscribe/
│       ├── PptToAudio/         #   "PPT Reader"
│       ├── PptMindmap/         #   "Kanvas Pikir"
│       └── GroupDiscussion/    #   "Ruang Lingkar"
│
├── shared/
│   ├── api/                    # cross-feature API clients (documents)
│   ├── hooks/                  # useMediaQuery, useIsomorphicLayoutEffect, useDocuments
│   ├── lib/                    # axios instance, token/cookie, theme constants
│   ├── store/                  # mindmap-store.ts (Zustand)
│   └── ui/                     # app shell: MainLayout, Sidebar, Navbars, Footer
│
├── components/ui/              # shadcn primitives (button)
├── lib/utils.ts               # cn() classname helper
└── proxy.ts                   # Next.js 16 middleware (route protection)
```

**Feature-folder convention** (every folder under `src/features/*`):

| Subfolder | Holds |
| --- | --- |
| `components/` | **one React component per file**; the route entry component (default export, imported by `app/.../page.tsx`) stays thin and composes siblings |
| `hooks/` | React hooks (data fetching, feature logic) |
| `service/` | API calls + response normalizers (no JSX) |
| `type/` | TypeScript types for the feature |
| `util/` | pure, non-JSX helpers and constants (formatters, class strings, data maps, guards) |

Path alias: `@/*` → `src/*`.

---

## User flow

> Language note: the product UI is in **Indonesian**. Feature names below use the
> in-app label with the internal route in parentheses.

### 0. First contact — landing page

**Route:** `/home` (`(landing-page)` group, `LandingLayout` = fixed `Navbar` + `Footer`).

A marketing page: hero video, the "Empat Pilar Akses" feature grid, an animated
"Cara Kerja" (how it works) section, and an accessibility call-to-action. All GSAP
animations check `prefers-reduced-motion` and render the final state instantly when
reduced motion is requested.

CTAs (`Masuk`, `Mulai Belajar`, `Mulai Sekarang`) → `/login`.

### 1. Register

**Route:** `/register` (`(auth)` group).

Form fields: **Nama, Email, Kata sandi, Ulangi kata sandi**. Validated client-side with
Zod (`registerSchema`): name ≥ 3 chars, valid email, password ≥ 8 chars, passwords must
match. Errors render inline per field.

On submit → `POST auth/register`. On success the Axios interceptor stores the returned
token in the `eql_access_token` cookie, a toast confirms, and the app redirects to
**`/dashboard`**.

Alternative: **"Daftar Dengan Google"** → see [Google sign-in](#3-google-sign-in).

### 2. Log in

**Route:** `/login`.

Fields: **Email, Kata sandi**, plus an "Ingat saya" checkbox (currently a UI flag; the
cookie is always a 7-day cookie). Validated with `loginSchema`.

On submit → `POST auth/login` → token cookie set → toast → redirect to **`/dashboard`**.

If the middleware bounced the user here from a protected page, the original path is in
`?next=` (available for future use).

### 3. Google sign-in

1. User clicks **"Lanjutkan / Daftar Dengan Google"**. `startGoogleLogin()` does a
   **full-page navigation** to `/api/auth/google/login` (proxied to the backend, which
   owns the OAuth handshake).
2. The provider redirects back to the **app root** with `?code=&state=`.
3. `src/app/page.tsx` sees `code` + `state` and redirects to
   `/auth/google/callback?code=&state=`.
4. `/auth/google/callback` (`useGoogleCallback`) calls
   `GET auth/google/callback?code=&state=` **once** (guarded by a ref). On success the
   token cookie is set and the user lands on **`/dashboard`**; on failure the page shows
   an error with a "back to login" button.

### 4. Landing in the app — Dashboard

**Route:** `/dashboard` (`(main)` group, `MainLayout` = `MainNavbar` top bar +
collapsible `Sidebar`).

On mount, `useHistory()` calls **`GET history/all?page=1&limit=50`**.

- **Stat badges** (top-right) are driven by the response `counts`:
  Dokumen (`total_summaries`), Transkrip (`total_stt`), Narasi (`total_tts`),
  Total (`total_all`).
- **History cards** — one per row, newest first. Each card shows the title, a short
  description, file name · type · size, and a relative timestamp. The backend `type`
  string is mapped best-effort to a "kind":
  - `document_summary` → **document**
  - anything matching `stt` / `transcription` / `speech_to_text` → **transcript**
  - anything matching `tts` / `text_to_speech` / `synthesis` / `narration` → **audio**
  - otherwise → **other**
- **Reopen the source** — footer buttons deep-link back into a feature:
  - document → **PPT Reader** (`/ppt-audio?documentId=<id>`) **and**
    **Kanvas Pikir** (`/ppt-canvas?documentId=<id>`)
  - audio → **PPT Reader** (`/ppt-audio`)
  - transcript → **Live Transcribe** (`/live-transcribe`)
- **Delete** — the trash button (shown on `document` / `other` cards only) calls
  **`DELETE documents/{id}`** with an optimistic removal; on error the card is restored
  and a toast explains why.
- The old category **filter tabs were removed** — `type` → feature mapping isn't
  reliable enough across every record kind.

States handled: loading spinner, error with "Coba lagi" (retry), and an empty state.

### 5. Live Transcribe

**Route:** `/live-transcribe`. **Needs microphone permission.**

1. User presses the mic button. `useSpeechToText("id-ID")` requests
   `getUserMedia({ audio })`, then opens
   `WS ws/speech-to-text?lang=id-ID` (or `NEXT_PUBLIC_WS_URL`).
2. The server sends a `ready` frame; the hook boots an **AudioWorklet**
   (`/worklets/pcm16-capture-processor.js`) that downsamples mic audio to 16 kHz
   PCM16 and streams raw buffers over the socket.
3. The server streams back `transcript` frames — **interim** lines (shown with a live
   accent bar) that get replaced by **final** lines. The transcript pane auto-scrolls
   to the newest line.
4. Pressing the button again (or unmounting) sends a flush to the worklet, releases the
   mic + audio graph, and closes the socket. A `finished` frame delivers the final
   full text.
5. Status is surfaced as a label (Siap Merekam → Menghubungkan → Live Recording →
   Menghentikan Rekaman → Rekaman Selesai) and a running timer.

The right-hand **"Ringkasan AI"** panel (key takeaways, key terms, action items) is
currently **mock data** with local, optimistic checkbox toggling — the summary
endpoints are not wired yet. `onGenerateSummary` / `onExport` are prop hooks left for
that integration.

### 6. PPT Reader (PPT → Audio)

**Route:** `/ppt-audio` (optionally `?documentId=<id>` to restore a saved summary).

1. **Upload** a PDF/PPT/DOC via the toolbar. A pending tab appears immediately, then
   `POST documents/summarize` runs (multipart; `language=en`, `detail_level=balanced`,
   `target_audience=student`, `save_to_history=true`).
2. The response is normalized (`normalize-summary.ts` — tolerant of many possible key
   names) into **AI Key Takeaways** (left panel) and a **synchronized transcript**
   split into paragraphs (middle panel). The URL is updated to `?documentId=<id>`.
3. **Voices** load from `GET speech/voices`. The narration text (the summary) is sent to
   `POST speech/synthesize` → an **MP3 blob** → object URL fed into an `<audio>` element.
4. The bottom **playback bar**: play/pause, skip to start/end, scrubber, playback speed
   cycle (1× → 2×), and a **voice picker** (changing the voice re-synthesizes). The
   transcript paragraphs are clickable to seek.
5. Revisiting `/ppt-audio?documentId=<id>` (e.g. from the Dashboard) calls
   `GET documents/{id}` and rebuilds the same view.

### 7. Kanvas Pikir (mind map)

**Route:** `/ppt-canvas` (optionally `?documentId=<id>`).

1. Open the **Source Context** side panel and upload a document →
   `POST documents/summarize` (`language=id`).
2. `documentToMindmap()` converts the summary into **nodes + edges** (a root concept
   plus child concepts) and a list of **extracted concepts**, all pushed into the
   Zustand `useMindmapStore`.
3. The canvas is **@xyflow/react**: pan/zoom, drag nodes, connect handles, an
   "Add Node" toolbar, minimap, and zoom controls. Clicking an extracted concept in the
   side panel promotes it to a node linked to the root.
4. `?documentId=<id>` loads a saved document via `GET documents/{id}` and regenerates
   the map. When a `documentId` is present, a **"Bagikan ke grup"** link jumps to
   `/canvas-discussion?documentId=<id>`.

### 8. Ruang Lingkar (group discussion)

**Route:** `/canvas-discussion`.

**Landing (no `groupId`):**
- **Create a room** — name, optional description, optional comma/space-separated member
  emails (validated) → `POST groups` → navigate into the new room.
- **Your groups** — `GET groups?page=&limit=` (infinite scroll, auto-refetched). Click
  a room to open it.

**Room (`?groupId=<id>`, optional `?documentId=<id>`):**
- `GET groups/{id}` (member roster, polled) + `GET groups/{id}/messages` (history,
  polled every 15 s) + a **`WS ws/chat`** connection for realtime.
- **Sending a message** is optimistic: the local bubble shows "mengirim…" until the
  server echoes it back; echoes are reconciled by `sender_id` + content (and against
  polled REST history as a backstop).
- **Connection banner** reflects the socket state (connected / connecting / session
  expired / realtime unavailable / disconnected) with a manual reconnect.
- **Modes** (persisted to `localStorage`):
  - *Standar* — default.
  - *Fokus* — larger text, hides the canvas panel.
  - *Baca nyaring* — adds a "Bacakan" / "Hentikan" control per incoming message using
    the browser `speechSynthesis` API (Indonesian voice).
- **Invite / manage members** — `POST groups/{id}/members` (by email),
  `DELETE groups/{id}/members/{userId}` (never a membership-record id).
- **Canvas panel** (right) — previews a shared mind map: paste a Kanvas Pikir link or
  document id → `GET documents/{id}` → shows title, summary, key points, and a link to
  open the full canvas. "Bagikan Kanvas" drops a shareable link into the composer.

### 9. Theme toggle

The `(main)` app supports **dark / light**. The toggle lives in `MainNavbar`; the
choice is written to `localStorage["equalilearn-theme"]` and applied via a
`data-app-theme` attribute on `<html>`. A tiny inline script in the root `<head>`
applies the stored theme **before first paint** to avoid a flash.

### 10. Log out

`MainNavbar` → **"Keluar"** → a **SweetAlert2** confirmation dialog → `POST auth/logout`.
Regardless of the API result, the token cookie is cleared, the React Query cache is
wiped, and the user is sent to `/login`.

---

## Development notes

- **Formatting & linting:** Biome (`biome.json`). 2-space indent, double quotes,
  semicolons, organized imports. Run `npx biome check --write src`.
- **Git hooks (Lefthook):** on commit, staged JS/TS/JSON/CSS get
  `biome check --write` and the whole project is type-checked (`tsc --noEmit`).
  Interactive rebases/`add -i` are not used here.
- **Adding UI:** create a **new file per component** under the feature's `components/`;
  put any pure helper or constant in that feature's `util/`. Keep the route's entry
  component thin.
- **Server vs client:** route entry components that use hooks are marked
  `"use client"`; their child component files inherit the client boundary.
- **This is Next.js 16.** APIs and conventions differ from older majors (e.g. the
  middleware file is `src/proxy.ts`, not `middleware.ts`). The `AGENTS.md` block at the
  repo root is generated by `next dev` — commit it with your changes to keep the tree
  clean.
- **Verify a change** with: `npx tsc --noEmit && npx biome check src && npx next build`.

---

## Build & deploy

```bash
npm run build     # production build (also runs tsc)
npm run start     # serve it on port 3000
```

Deployment requirements:

- `NEXT_PUBLIC_BASE_API_URL` must be set **at build time** — it's inlined into the
  client bundle *and* used to register the `/api/*` rewrite. Rebuild when it changes.
- The Next.js server must be able to reach the backend host (the `/api` proxy runs
  server-side).
- WebSocket features need the backend host reachable directly from the browser over
  `wss://`.

Any Node host that can run `next start` works (Vercel, a container, etc.).

---

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| Every API call 404s / login does nothing | `NEXT_PUBLIC_BASE_API_URL` is unset or wrong. With it unset, `next.config.ts` registers **no** `/api` rewrite. Set it and restart `npm run dev`. |
| Logged in but immediately bounced to `/login` | No `eql_access_token` cookie was written — check that the auth response actually contains a `token` / `access_token`, and that you're on `http://localhost` or HTTPS (the cookie is `Secure` in production). |
| Google login loops or errors on `/auth/google/callback` | The backend `GET auth/google/callback` rejected the `code`/`state`, or `/api/auth/google/login` isn't proxied. Confirm `NEXT_PUBLIC_BASE_API_URL` and the backend OAuth config. |
| Live Transcribe never leaves "Menghubungkan" | Mic permission denied, or the speech socket can't connect. Check browser mic permissions and `NEXT_PUBLIC_WS_URL` / the derived `wss://…/ws/speech-to-text` URL. |
| Chat shows "Pengiriman real-time belum tersedia" or "terputus" | The `ws/chat` socket isn't reachable (token expired, or `NEXT_PUBLIC_BASE_API_URL` host doesn't accept `wss://`). History still polls every 15 s. |
| `biome check` fails only in `src/app/globals.css` | Pre-existing `!important` warnings in the stylesheet — unrelated to app code. |
| Dashboard delete button "fails" on a transcript/audio card | `DELETE documents/{id}` only applies to document-backed rows; delete is intentionally hidden for STT/TTS kinds. |
