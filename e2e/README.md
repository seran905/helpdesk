# E2E harness

Playwright is installed and configured at the repo root (not inside `client/` or
`server/`) because it needs to drive both independent npm projects at once.

## What runs, and against what database

`playwright.config.ts` starts two `webServer` processes — `server/` on port
**4001** and `client/` on port **4173** — deliberately different from the
normal dev ports (3001/5173), so `npm run test:e2e` never has to fight over a
port with a manually-running `npm run dev`. `e2e/global-setup.ts` then runs
`prisma migrate deploy` and the seed script against the database in
`server/.env.test` (`helpdesk_test`, not the normal dev `helpdesk` database).
`migrate deploy` creates that database automatically the first time it runs.

Because the client's API base URL isn't otherwise configurable
(`client/src/lib/auth-client.ts` and `client/src/pages/HomePage.tsx` default
to `http://localhost:3001`), the e2e client webServer entry sets
`VITE_API_URL=http://localhost:4001` so the client built for e2e actually
talks to the e2e server instead of the real dev one. The e2e server entry
similarly overrides `PORT`, `CLIENT_URL`, and `BETTER_AUTH_URL` on top of
whatever `server/.env.test` says, so CORS and better-auth's own base URL line
up with the e2e client's port rather than the dev one.

## Running `npm run test:e2e`

No need to stop your dev servers — e2e runs on its own ports. Both `webServer`
entries use `reuseExistingServer: !process.env.CI`, so locally, a second
`npm run test:e2e` reuses an already-running e2e server from a prior run
(faster iteration while writing tests) instead of respawning it; in CI it
always spawns fresh.

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
