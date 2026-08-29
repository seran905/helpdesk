import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const ticketsRouter = Router();

ticketsRouter.get("/", requireAuth, async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      subject: true,
      status: true,
      category: true,
      requesterEmail: true,
      requesterName: true,
      createdAt: true,
      assignedTo: { select: { id: true, name: true } },
    },
  });
  res.json({ tickets });
});
