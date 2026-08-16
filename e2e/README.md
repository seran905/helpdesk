# E2E harness

Playwright is installed and configured at the repo root (not inside `client/` or
`server/`) because it needs to drive both independent npm projects at once.

## What runs, and against what database

`playwright.config.ts` starts two `webServer` processes — `server/` on port 3001
and `client/` on port 5173 — then `e2e/global-setup.ts` runs `prisma migrate
deploy` and the seed script against the database in `server/.env.test`
(`helpdesk_test`, not the normal dev `helpdesk` database). `migrate deploy`
creates that database automatically the first time it runs.

## Before running `npm run test:e2e`

Stop any `npm run dev` you have running in `client/` and `server/` first.

The config uses `reuseExistingServer: false` on both servers, on purpose: if
Playwright were allowed to attach to an already-running dev server instead of
spawning its own, it would reuse whatever database that dev server was started
against — silently defeating the point of having a separate test database.
`false` means a server already occupying port 3001/5173 makes Playwright fail
loudly instead of testing against the wrong data. Free the ports, then run.

## Adding the first real test

No spec files exist yet — this is setup/config only. `testDir` is `./e2e`, so
spec files go there (e.g. `e2e/login.spec.ts`).

The one thing worth doing before writing specs that log in: better-auth rate
limits `/sign-in/email` to 5 requests per 60s (`server/src/lib/auth.ts`). If
every spec logs in independently, you'll trip that limit once you have more
than a handful of specs. Standard Playwright pattern to avoid it:

1. Add an `e2e/auth.setup.ts` that logs in once and saves the session via
   `page.context().storageState({ path: 'e2e/.auth/user.json' })`.
2. Add a `setup` project to `playwright.config.ts` with
   `testMatch: '**/*.setup.ts'`.
3. Give your real test projects `dependencies: ['setup']` and
   `use: { storageState: 'e2e/.auth/user.json' }`.

`e2e/.auth/` is already gitignored so the saved session never gets committed.
