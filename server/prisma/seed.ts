import "dotenv/config";
import { auth } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";
import { Role } from "../src/generated/prisma/enums.js";

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
  const user = await ctx.internalAdapter.createUser({
    email,
    name: "Admin",
    emailVerified: true,
    role: Role.admin,
  });

  const hashedPassword = await ctx.password.hash(password);

  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    accountId: user.id,
    providerId: "credential",
    password: hashedPassword,
  });

  console.log(`Created admin user: ${user.email}`);
}

await prisma.$disconnect();
