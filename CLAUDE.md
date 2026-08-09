# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation lookups

Use the context7 MCP server to fetch up-to-date documentation whenever working with a library, framework, or API in this repo (React, Express, Prisma, Vite, etc.) — setup, config, or API usage should come from context7, not memory, since training data may be stale. Resolve the library ID first, then query the docs for the specific concept needed.

## Project

This is an AI-powered ticket management system. See `project-scope.md` for the product problem/solution/features, `tech-stack.md` for the chosen stack, and `implementation-plan.md` for the phased build-out. Implemented so far: health-check round trip, Prisma-backed auth (better-auth) with admin/agent roles and a seed script (`server/prisma/seed.ts`, requires `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars), and a login page with session-aware routing and nav bar. Most of the ticketing functionality itself is still unbuilt.

## Repository structure

Two independent npm projects, not a workspace/monorepo — install and run each separately.

- `client/` — React 19 + TypeScript, built with Vite. UI components come from shadcn/ui (`components.json`, base style `base-rhea`, theme preset `b3mQUKE5I`, components under `client/src/components/ui/`, `@/*` path alias to `client/src/*`). Use `npx shadcn@latest add <component>` to add more; prefer shadcn's theme tokens (`bg-primary`, `text-foreground`, `border-border`, etc. from `client/src/index.css`) over hardcoded Tailwind colors so custom UI stays on-theme.
- `server/` — Express + TypeScript, run with `tsx`, ESM (`"type": "module"`, `NodeNext` module resolution).

The client calls the server directly over HTTP using a hardcoded base URL (`http://localhost:3001`, see `client/src/lib/auth-client.ts` and `client/src/pages/HomePage.tsx`) — there is no Vite dev proxy. The server allows this cross-origin access via `cors({ origin: clientUrl, credentials: true })`, where `clientUrl` comes from the `CLIENT_URL` env var and defaults to `http://localhost:5173`. **Gotcha:** if the Vite dev server ends up on a different port (e.g. 5173 already taken, so Vite falls back to 5174), the origin won't match and every request — including login — silently fails client-side with "Failed to reach the server". Fix by freeing/using port 5173, or setting `CLIENT_URL` to match.

Neither dev server is managed by a process supervisor — there's no nodemon/pm2 config. `npm run dev` in `server/` has to be started (and restarted) manually in its own terminal; if it's not running, the client shows the same "Failed to reach the server" error.

## Authentication

Auth is [better-auth](https://www.better-auth.com), backed by Postgres via the Prisma adapter (`server/src/lib/auth.ts`). Email/password only, with `disableSignUp: true` — there is no public registration endpoint. The only way to create a user is `server/prisma/seed.ts` (reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` from env, and uses `ctx.internalAdapter` directly to bypass the disabled sign-up flow).

- **Schema**: `User`/`Session`/`Account`/`Verification` models in `server/prisma/schema.prisma`, following better-auth's expected shape. `User.role` is a required `Role` enum (`admin` | `agent`) added as a better-auth `additionalFields` entry with `input: false` — it's readable but not settable through the auth API, so roles can only be assigned by seeding/editing the DB directly, never by a client request (prevents self-elevation).
- **Server routes**: mounted at `app.all("/api/auth/*splat", toNodeHandler(auth))` in `server/src/index.ts`, **before** `app.use(express.json())`. Keep it in that order — better-auth's node handler parses the request body itself, so adding `express.json()` upstream of it will break auth requests.
- **Protecting server routes**: wrap the handler with `requireAuth` (`server/src/middleware/requireAuth.ts`), which calls `auth.api.getSession()` and attaches `req.session`/`req.user`, or replies `401` if there's no session. See `/api/me` for the pattern.
- **Client**: `client/src/lib/auth-client.ts` creates the better-auth React client (`baseURL: 'http://localhost:3001'`, hardcoded like elsewhere) with the `inferAdditionalFields` plugin so `role` is typed on `session.user`. Exports `useSession`, `signIn`, `signOut`.
- **Client-side route gating**: `ProtectedRoute` (`client/src/components/ProtectedRoute.tsx`) reads `useSession()` and redirects to `/login` when there's no session; `RedirectIfAuthed` in `App.tsx` does the inverse on `/login` itself. Both only gate rendering — they are not a substitute for server-side `requireAuth` checks.
- Sessions are cookie-based (`better-auth.session_token`, `HttpOnly`, `SameSite=Lax`), which is why the server's `cors()` needs `credentials: true` and an exact origin match rather than a wildcard — see the `CLIENT_URL`/port gotcha above.

## Commands

Run from `client/`:
- `npm run dev` — start the Vite dev server (http://localhost:5173)
- `npm run build` — type-check (`tsc -b`) and build for production
- `npm run lint` — lint with oxlint

Run from `server/`:
- `npm run dev` — start the Express server with `tsx watch` (http://localhost:3001)
- `npm run build` — compile TypeScript to `dist/`
- `npm run start` — run the compiled server from `dist/`
- `npx tsx prisma/seed.ts` — seed the initial admin user (needs `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`)

No test suite exists yet in either project.
