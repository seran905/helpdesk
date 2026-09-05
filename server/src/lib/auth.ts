import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { Role } from "../generated/prisma/enums.js";

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  trustedOrigins: [process.env.CLIENT_URL ?? "http://localhost:5173"],
  // Client and server deploy to separate origins, so the session cookie needs
  // SameSite=None (requires Secure) to be sent on cross-origin requests.
  advanced: isProduction
    ? { useSecureCookies: true, defaultCookieAttributes: { sameSite: "none", secure: true } }
    : undefined,
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: [Role.admin, Role.agent],
        required: true,
        input: false,
      },
    },
  },
});
