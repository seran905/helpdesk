import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { Role } from "../generated/prisma/enums.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  trustedOrigins: [process.env.CLIENT_URL ?? "http://localhost:5173"],
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
