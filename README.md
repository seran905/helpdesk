# Helpdesk

An AI-powered ticket management system. Inbound support emails become tickets that are automatically classified, summarized, and given AI-suggested replies, freeing agents to focus on the tickets that need a human touch. See [`project-scope.md`](project-scope.md) for the full problem/solution/feature rundown.

## Stack

- **Client**: React 19 + TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query/Table
- **Server**: Express + TypeScript (ESM), Prisma + PostgreSQL, pg-boss for background jobs
- **Auth**: [better-auth](https://www.better-auth.com), email/password, admin/agent roles, no public sign-up
- **AI**: Vercel AI SDK (`ai` + `@ai-sdk/openai`) with OpenAI's `gpt-5-nano`, powering the AI assistant **Suzhi.ai** (name set in `server/src/lib/aiAgent.ts`) — ticket classification, auto-resolution, and drafting/polishing agent replies against the support knowledge base (`server/knowledge-base.md`)
- **core**: a shared package of `zod` schemas/types used by both `client` and `server`

See [`tech-stack.md`](tech-stack.md) for the originally planned stack (a couple of pieces there, like SendGrid/Mailgun email delivery and Claude-based classification, are aspirational and not wired up yet) and [`implementation-plan.md`](implementation-plan.md) for the phased build-out.

## Repository structure

An npm workspace with three packages:

- `client/` — the React app
- `server/` — the Express API, mounted routes for `/api/tickets`, `/api/users`, `/api/webhooks`, plus auth (`/api/auth/*`)
- `core/` — shared schemas/types, consumed as the `core` package by both other workspaces (has its own build step — see below)

Plus a Playwright E2E harness at the repo root (`e2e/`).

Full conventions (data fetching, validation, auth wiring, testing patterns, etc.) are documented in [`CLAUDE.md`](CLAUDE.md).

## Getting started

**Requirements**: Node >= 22, a local PostgreSQL instance.

```bash
npm install   # once, from the repo root — installs and links all three workspaces
```

Create `server/.env` from `server/.env.example` and fill in the values (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `OPENAI_API_KEY`, etc.).

```bash
# 1. Build the shared core package
cd core && npm run build

# 2. Run migrations and seed the initial admin user
cd ../server
npx prisma migrate deploy
npx tsx prisma/seed.ts

# 3. Start the server (http://localhost:3001)
npm run dev

# 4. In another terminal, start the client (http://localhost:5173)
cd ../client
npm run dev
```

Log in at `http://localhost:5173/login` with the `ADMIN_EMAIL`/`ADMIN_PASSWORD` you seeded.

If you change a schema in `core/`, re-run `npm run build` (or `npm run build:watch`) there — `client`/`server` resolve to `core/dist`, not its TypeScript source, so changes don't show up until it's rebuilt.

## Testing

```bash
# Component tests (client/)
cd client && npm run test

# E2E tests (repo root — spins up its own dedicated server/client ports and test DB)
npm run test:e2e
```

See the Testing section of [`CLAUDE.md`](CLAUDE.md) for what's covered where, and `e2e/README.md` for E2E specifics.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for deploying to Railway (two services + Postgres).
