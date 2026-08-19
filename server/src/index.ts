import "dotenv/config";
import "./lib/env.js";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { prisma } from "./lib/prisma.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { usersRouter } from "./routes/users.js";

const app = express();
const port = process.env.PORT ?? 3001;
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";

app.use(cors({ origin: clientUrl, credentials: true }));

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/db-health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", message: (err as Error).message });
  }
});

app.get("/api/me", requireAuth, (req, res) => {
  const { id, name, email, emailVerified, image, role, createdAt, updatedAt } = req.user!;
  res.json({ user: { id, name, email, emailVerified, image, role, createdAt, updatedAt } });
});

app.use("/api/users", usersRouter);

app.listen(port, async () => {
  await prisma.$connect();
  console.log(`Server running on http://localhost:${port}`);
  console.log("Connected to database");
});
