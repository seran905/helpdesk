import { Router } from "express";
import { createUserSchema, updateUserSchema } from "core";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { parseBody } from "../lib/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { Role } from "../generated/prisma/enums.js";

export const usersRouter = Router();

usersRouter.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.json({ users });
});

usersRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const data = parseBody(createUserSchema, req.body, res);
  if (!data) return;
  const { name, email, password } = data;

  const ctx = await auth.$context;

  const existing = await ctx.internalAdapter.findUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }

  const user = await ctx.internalAdapter.createUser({
    email,
    name,
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

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
  });
});

usersRouter.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const data = parseBody(updateUserSchema, req.body, res);
  if (!data) return;
  const { name, email, password } = data;
  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const ctx = await auth.$context;

  const existing = await ctx.internalAdapter.findUserById(id);
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const emailOwner = await ctx.internalAdapter.findUserByEmail(email);
  if (emailOwner && emailOwner.user.id !== id) {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }

  const user = await ctx.internalAdapter.updateUser(id, { name, email });

  if (password.length > 0) {
    const hashedPassword = await ctx.password.hash(password);
    await ctx.internalAdapter.updatePassword(id, hashedPassword);
  }

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
  });
});
