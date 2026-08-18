# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation lookups

Use the context7 MCP server to fetch up-to-date documentation whenever working with a library, framework, or API in this repo (React, Express, Prisma, Vite, etc.) — setup, config, or API usage should come from context7, not memory, since training data may be stale. Resolve the library ID first, then query the docs for the specific concept needed.

## Project

This is an AI-powered ticket management system. See `project-scope.md` for the product problem/solution/features, `tech-stack.md` for the chosen stack, and `implementation-plan.md` for the phased build-out. Implemented so far: health-check round trip, Prisma-backed auth (better-auth) with admin/agent roles and a seed script (`server/prisma/seed.ts`, requires `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars), a login page with session-aware routing and nav bar, and a role-gated `/users` page (admin-only, placeholder heading so far). Most of the ticketing functionality itself is still unbuilt.

## Repository structure

Two independent npm projects, not a workspace/monorepo — install and run each separately.

- `client/` — React 19 + TypeScript, built with Vite. UI components come from shadcn/ui (`components.json`, base style `base-rhea`, theme preset `b3mQUKE5I`, components under `client/src/components/ui/`, `@/*` path alias to `client/src/*`). Use `npx shadcn@latest add <component>` to add more; prefer shadcn's theme tokens (`bg-primary`, `text-foreground`, `border-border`, etc. from `client/src/index.css`) over hardcoded Tailwind colors so custom UI stays on-theme.
- **Data fetching**: use `axios` + TanStack Query (`@tanstack/react-query`) for any server data, not raw `fetch`/`useEffect`. Call the server through the shared `apiClient` instance (`client/src/lib/api-client.ts`, an `axios.create({ baseURL: VITE_API_URL fallback, withCredentials: true })`) as the `queryFn` inside `useQuery`/`useMutation`, following the pattern in `HomePage.tsx` (health check) and `UsersPage.tsx` (user list). `QueryClientProvider` is set up once at the root in `App.tsx`. `withCredentials: true` on `apiClient` is required for authenticated routes since requests are cross-origin (client/server on different ports) and sessions are cookie-based — don't call `fetch` directly for new server calls, since it won't send the session cookie without also manually adding `credentials: 'include'`.
- `server/` — Express + TypeScript, run with `tsx`, ESM (`"type": "module"`, `NodeNext` module resolution).

A third, root-level `package.json` also exists, but only for the Playwright E2E harness (see Testing below) — it doesn't make this a monorepo/workspace; `client/` and `server/` still install and run independently of it and of each other.

The client calls the server directly over HTTP using a base URL that defaults to `http://localhost:3001` but can be overridden via the `VITE_API_URL` env var (see `client/src/lib/auth-client.ts` and `client/src/pages/HomePage.tsx`) — there is no Vite dev proxy. The Playwright e2e harness uses this override to point the client at its own dedicated server port (see Testing below); day-to-day dev doesn't need to set it. The server allows this cross-origin access via `cors({ origin: clientUrl, credentials: true })`, where `clientUrl` comes from the `CLIENT_URL` env var and defaults to `http://localhost:5173`. **Gotcha:** if the Vite dev server ends up on a different port (e.g. 5173 already taken, so Vite falls back to 5174), the origin won't match and every request — including login — silently fails client-side with "Failed to reach the server". Fix by freeing/using port 5173, or setting `CLIENT_URL` to match.

Neither dev server is managed by a process supervisor — there's no nodemon/pm2 config. `npm run dev` in `server/` has to be started (and restarted) manually in its own terminal; if it's not running, the client shows the same "Failed to reach the server" error.

## Authentication

Auth is [better-auth](https://www.better-auth.com), backed by Postgres via the Prisma adapter (`server/src/lib/auth.ts`). Email/password only, with `disableSignUp: true` — there is no public registration endpoint. The only way to create a user is `server/prisma/seed.ts` (reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` from env, and uses `ctx.internalAdapter` directly to bypass the disabled sign-up flow).

- **Schema**: `User`/`Session`/`Account`/`Verification` models in `server/prisma/schema.prisma`, following better-auth's expected shape. `User.role` is a required `Role` enum (`admin` | `agent`) added as a better-auth `additionalFields` entry with `input: false` — it's readable but not settable through the auth API, so roles can only be assigned by seeding/editing the DB directly, never by a client request (prevents self-elevation).
- **Server routes**: mounted at `app.all("/api/auth/*splat", toNodeHandler(auth))` in `server/src/index.ts`, **before** `app.use(express.json())`. Keep it in that order — better-auth's node handler parses the request body itself, so adding `express.json()` upstream of it will break auth requests.
- **Protecting server routes**: wrap the handler with `requireAuth` (`server/src/middleware/requireAuth.ts`), which calls `auth.api.getSession()` and attaches `req.session`/`req.user`, or replies `401` if there's no session. See `/api/me` for the pattern.
- **Client**: `client/src/lib/auth-client.ts` creates the better-auth React client (`baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001'`, same override as `HomePage.tsx`'s health check) with the `inferAdditionalFields` plugin so `role` is typed on `session.user`. Exports `useSession`, `signIn`, `signOut`. Note: `role` is declared as `{ type: 'string' }` in the plugin config, so `session.user.role` is typed as plain `string`, not the `'admin' | 'agent'` literal union — code branching on it (e.g. `allowedRoles` below) has to type against `string`.
- **Client-side route gating**: `ProtectedRoute` (`client/src/components/ProtectedRoute.tsx`) reads `useSession()` and redirects to `/login` when there's no session; takes an optional `allowedRoles?: string[]` prop that redirects to `/` when the session's role isn't in the list (used to gate `/users` to `['admin']` in `App.tsx`). `RedirectIfAuthed` in `App.tsx` does the inverse of the no-session check on `/login` itself. All of this only gates rendering — it is not a substitute for server-side `requireAuth` checks, and there is no server-side role check yet for `/users`-related data.
- Sessions are cookie-based (`better-auth.session_token`, `HttpOnly`, `SameSite=Lax`), which is why the server's `cors()` needs `credentials: true` and an exact origin match rather than a wildcard — see the `CLIENT_URL`/port gotcha above.
- **Rate limiting**: better-auth's `rateLimit` (`server/src/lib/auth.ts`) is gated on `process.env.NODE_ENV === "production"` — off under `npm run dev` and under the Playwright e2e harness (neither sets `NODE_ENV`), on under `npm run start` (which sets `NODE_ENV=production`). When enabled: global limit `100`/60s, plus a stricter custom rule of `5`/60s on `/sign-in/email`.

## Commands

Run from `client/`:
- `npm run dev` — start the Vite dev server (http://localhost:5173)
- `npm run build` — type-check (`tsc -b`) and build for production
- `npm run lint` — lint with oxlint
- `npm run test` — run all component tests once (`vitest run`)
- `npm run test:watch` / `npm run test:write` — same test run, in Vitest's interactive watch mode; `test:write` is just an alias for `test:watch` under a name that matches when you'd reach for it (actively writing/iterating on a test)

Run from `server/`:
- `npm run dev` — start the Express server with `tsx watch` (http://localhost:3001)
- `npm run build` — compile TypeScript to `dist/`
- `npm run start` — run the compiled server from `dist/` (sets `NODE_ENV=production`, which also turns on auth rate limiting — see Authentication above)
- `npx tsx prisma/seed.ts` — seed the initial admin user (needs `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`)

Run from repo root:
- `npm run test:e2e` — run the Playwright E2E suite (`playwright.config.ts`)
- `npm run test:e2e:ui` — same, with Playwright's UI mode
- `npm run playwright:install` — install/update the Playwright browser binaries

## Testing

### Component tests (`client/`)

`server/` has no unit/integration test suite yet. `client/` has component tests via Vitest + React Testing Library.

- **Config**: `client/vitest.config.ts` (merges into `client/vite.config.ts` via `mergeConfig`, `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']` which imports `@testing-library/jest-dom/vitest` for the matcher extensions).
- **Running**: from `client/`, `npm run test` runs the suite once; `npm run test:watch` (alias `npm run test:write`) runs it in interactive watch mode — reach for the watch/write variant while actively writing or iterating on a test, `test` for a one-shot check (e.g. before committing).
- **Where tests live**: co-located as `*.test.tsx` next to the component under test (e.g. `client/src/pages/UsersPage.tsx` → `client/src/pages/UsersPage.test.tsx`).
- **Render helpers**: a small `render<PageName>()` helper (wraps the page in a fresh `QueryClientProvider` with `retry: false`, so error-state assertions don't wait through TanStack Query's default retries, and calls Testing Library's `render`) lives in its own module under `client/src/test/` — e.g. `client/src/test/renderUsersPage.tsx` — and is imported into the matching `*.test.tsx` file rather than redefined inline. Add a new one alongside it (`render<PageName>.tsx`) for each new page under test, following the same shape.
- **Mocking data**: mock `apiClient` from `client/src/lib/api-client.ts` with `vi.mock('@/lib/api-client', () => ({ apiClient: { get: vi.fn() } }))` at the top of the test file (`vi.mock` is hoisted, so this also covers the module graph pulled in through the `render<PageName>` helper), then set per-test return values with `vi.mocked(apiClient.get).mockResolvedValue(...)` / `mockRejectedValue(...)`, resetting in `beforeEach`.
- **Assertions**: use `screen.findBy*`/`waitFor` for the async pending → settled transition rather than asserting synchronously; use `screen.getByRole`/`getByText` over test IDs where the markup already has an accessible role/text, matching the E2E suite's selector conventions below.

### E2E tests (repo root)

A Playwright E2E harness exists at the repo root (`playwright.config.ts`, `e2e/`) with real spec files under `e2e/` (login, protected-route/role gating, sign-out — see `e2e/README.md` for what's covered and what's intentionally skipped). It lives at the root rather than in `client/` or `server/` because it drives both: `webServer` starts the server and client dev processes on **dedicated e2e-only ports (4001/4173, not the normal 3001/5173)**, then `e2e/global-setup.ts` runs `prisma migrate deploy` + the seed script against the **separate** test database defined in `server/.env.test` (`helpdesk_test`, not the dev `helpdesk` DB) before any test runs. The client webServer entry sets `VITE_API_URL` to point at the e2e server port (see the `VITE_API_URL` note above); the server entry overrides `PORT`/`CLIENT_URL`/`BETTER_AUTH_URL` to match. Because the ports are dedicated to e2e rather than shared with dev, **`npm run test:e2e` does not require stopping `npm run dev`** — both can run at the same time.

Use the `e2e-test-writer` subagent to write E2E spec files (`e2e/<feature>.spec.ts`) — it already knows the harness details above, the client's route/component structure, and this repo's selector/assertion conventions. It writes tests only; it doesn't set up or reconfigure `playwright.config.ts`/`e2e/global-setup.ts` unless a test genuinely needs a harness change (e.g. adding a new auth-setup/storageState project for a different role).
