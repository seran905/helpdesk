import type { auth } from "../lib/auth.js";

type AuthSession = typeof auth.$Infer.Session;

declare module "express-serve-static-core" {
  interface Request {
    session?: AuthSession["session"];
    user?: AuthSession["user"];
  }
}
