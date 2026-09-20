import "dotenv/config";
import "../src/lib/env.js";
import { createLocalAccountIssuer } from "better-auth";
import { auth } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";
import { Role } from "../src/generated/prisma/enums.js";
import { AI_AGENT_EMAIL, AI_AGENT_NAME } from "../src/lib/aiAgent.js";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed the admin user");
}

const ctx = await auth.$context;

const existing = await ctx.internalAdapter.findUserByEmail(email);

if (existing) {
  console.log(`Admin user already exists: ${email}`);
} else {
  const user = await ctx.internalAdapter.createUser(
    {
      email,
      name: "Admin",
      emailVerified: true,
      role: Role.admin,
    },
    { method: "admin" },
  );

  const hashedPassword = await ctx.password.hash(password);

  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    accountId: user.id,
    providerId: "credential",
    issuer: createLocalAccountIssuer("credential"),
    password: hashedPassword,
  });

  console.log(`Created admin user: ${user.email}`);
}

const existingAiAgent = await ctx.internalAdapter.findUserByEmail(AI_AGENT_EMAIL);

if (existingAiAgent) {
  console.log(`AI agent already exists: ${AI_AGENT_EMAIL}`);
} else {
  const aiAgent = await ctx.internalAdapter.createUser(
    {
      email: AI_AGENT_EMAIL,
      name: AI_AGENT_NAME,
      emailVerified: true,
      role: Role.agent,
    },
    { method: "admin" },
  );

  console.log(`Created AI agent: ${aiAgent.email}`);
}

await prisma.$disconnect();
