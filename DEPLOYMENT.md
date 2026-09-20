# Deploying to Railway

This repo deploys as **two Railway services** (`server`, `client`) plus a **Postgres** database, all in one Railway project. Railway's own guidance for a shared monorepo like this is to leave each service's **Root Directory** at the default (repo root) and give each service its own Build/Start commands in its dashboard settings, rather than checking in one `railway.json` for both — a single committed config conflicts between services with different start commands, so the settings below are entered directly in the Railway dashboard (or via `railway environment edit`), not as files in this repo.

## 1. Create the project and database

1. Create a new Railway project from this GitHub repo.
2. Add a **Postgres** database to the project (Railway's built-in plugin). This gives you `${{Postgres.DATABASE_URL}}` to reference from other services.

## 2. `server` service

**Settings → Build:**
- Root Directory: leave blank (repo root)
- Build Command: `npm run build --workspace=core && npm run build --workspace=server`
- (Railway's automatic install step runs `npm ci` at the repo root first — this builds on top of that, so both `core` and `server` get compiled and `server`'s build script also runs `prisma generate`.)

**Settings → Deploy:**
- Pre-Deploy Command: `npm run migrate:deploy --workspace=server`
- Start Command: `npm run start --workspace=server`
- Healthcheck Path: `/api/health`

**Variables:**

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `BETTER_AUTH_SECRET` | generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://${{server.RAILWAY_PUBLIC_DOMAIN}}` (substitute your actual server service name) |
| `CLIENT_URL` | `https://${{client.RAILWAY_PUBLIC_DOMAIN}}` (substitute your actual client service name) |
| `INBOUND_EMAIL_WEBHOOK_SECRET` | generate with `openssl rand -base64 32` |
| `INBOUND_EMAIL_WEBHOOK_SECRET_HEADER` | `x-webhook-secret` |
| `OPENAI_API_KEY` | your key |
| `SENTRY_DSN` | your server Sentry DSN (optional — leave unset to disable) |
| `SENTRY_ENVIRONMENT` | `production` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | only needed transiently to run the seed script once, see step 4 |

`PORT` is injected automatically by Railway — `server/src/index.ts` already listens on `process.env.PORT`.

Enable public networking on this service so it gets a `RAILWAY_PUBLIC_DOMAIN`.

## 3. `client` service

**Settings → Build:**
- Root Directory: leave blank (repo root)
- Build Command: `npm run build --workspace=core && npm run build --workspace=client`

**Settings → Deploy:**
- Start Command: `npm run start --workspace=client` (runs `serve --single --listen $PORT dist`, added to `client/package.json`; `--single` is required so client-side routes like `/tickets/123` don't 404 on refresh)
- Healthcheck Path: `/`

**Variables** (these are baked into the static bundle at *build* time, since Vite reads `import.meta.env.VITE_*` when it builds — set them before triggering a build):

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://${{server.RAILWAY_PUBLIC_DOMAIN}}` (substitute your actual server service name) |
| `VITE_SENTRY_DSN` | your client Sentry DSN (optional) |
| `VITE_SENTRY_ENVIRONMENT` | `production` |

Enable public networking on this service too.

## 4. First-time setup after both services deploy successfully

Migrations run automatically via the server's Pre-Deploy Command on every deploy. Seeding the initial admin user is a one-off, so it's not wired into every deploy — run it once via the Railway CLI:

```bash
railway link   # link to this project if not already linked
railway run --service server npm run seed --workspace=server
```

This requires `ADMIN_EMAIL`/`ADMIN_PASSWORD` to be set on the server service at the time you run it (they don't need to stay set afterward — the seed script is the only thing that reads them, and `server/src/lib/env.ts`'s required-vars check doesn't include them).

## Why cross-origin cookies needed a code change

`server` and `client` land on two different Railway-assigned domains (or two different subdomains, if you attach custom domains later), so the better-auth session cookie needs `SameSite=None; Secure` to be sent on cross-origin requests from the client to the server — the default `SameSite=Lax` only works when both are truly same-site. This is handled in `server/src/lib/auth.ts` (`advanced.defaultCookieAttributes`, gated on `NODE_ENV === "production"`, which the `start` script already sets) — no further action needed, just make sure both services are served over HTTPS (Railway does this by default).
