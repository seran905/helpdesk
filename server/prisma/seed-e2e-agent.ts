import "dotenv/config";
import "../src/lib/env.js";
import { auth } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";
import { Role } from "../src/generated/prisma/enums.js";

// E2E-only fixture: seed.ts intentionally only ever creates a single admin
// user (from ADMIN_EMAIL/ADMIN_PASSWORD), so this script exists purely to
// give the e2e suite an agent-role user to test role gating against. It
// only ever runs against the isolated helpdesk_test database (see
// e2e/global-setup.ts). Credentials come from AGENT_EMAIL/AGENT_PASSWORD in
// server/.env.test, the same file e2e/agent-auth.setup.ts reads them from.
const email = process.env.AGENT_EMAIL;
const password = process.env.AGENT_PASSWORD;

if (!email || !password) {
  throw new Error("AGENT_EMAIL and AGENT_PASSWORD must be set to seed the e2e agent user");
}

const ctx = await auth.$context;

const existing = await ctx.internalAdapter.findUserByEmail(email);

if (existing) {
  console.log(`E2E agent user already exists: ${email}`);
} else {
  const user = await ctx.internalAdapter.createUser({
    email,
    name: "Test Agent",
    emailVerified: true,
    role: Role.agent,
  });

  const hashedPassword = await ctx.password.hash(password);

  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    accountId: user.id,
    providerId: "credential",
    password: hashedPassword,
  });

  console.log(`Created e2e agent user: ${user.email}`);
}

await prisma.$disconnect();
