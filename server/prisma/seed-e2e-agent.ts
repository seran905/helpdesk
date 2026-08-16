import "dotenv/config";
import "../src/lib/env.js";
import { auth } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";
import { Role } from "../src/generated/prisma/enums.js";

// E2E-only fixture: seed.ts intentionally only ever creates a single admin
// user (from ADMIN_EMAIL/ADMIN_PASSWORD), so this script exists purely to
// give the e2e suite an agent-role user to test role gating against. It
// only ever runs against the isolated helpdesk_test database (see
// e2e/global-setup.ts), never against a real dev/production database, so
// hardcoded credentials here are fine.
const email = "agent@example.com";
const password = "password123";

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
