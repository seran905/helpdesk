import { randomUUID } from "node:crypto";
import { Router } from "express";
import {
  assignTicketSchema,
  createReplySchema,
  polishReplySchema,
  ticketListQuerySchema,
  updateTicketCategorySchema,
  updateTicketStatusSchema,
} from "core";
import { polishReply } from "../lib/replyPolisher.js";
import { summarizeTicket } from "../lib/ticketSummarizer.js";
import { buildOrderBy, buildWhere } from "../lib/ticketQuery.js";
import type { TicketStats } from "../lib/ticketStats.js";
import { prisma } from "../lib/prisma.js";
import { parseBody, parseTicketId } from "../lib/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Role, SenderType } from "../generated/prisma/enums.js";

export const ticketsRouter = Router();

ticketsRouter.get("/", requireAuth, async (req, res) => {
  const query = parseBody(ticketListQuerySchema, req.query, res);
  if (!query) return;

  const where = buildWhere(query);

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.sortOrder),
      skip: query.pageIndex * query.pageSize,
      take: query.pageSize,
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
    }),
    prisma.ticket.count({ where }),
  ]);
  res.json({ tickets, total });
});

ticketsRouter.get("/stats", requireAuth, async (req, res) => {
  const [{ get_ticket_stats: stats }] = await prisma.$queryRaw<
    { get_ticket_stats: TicketStats }[]
  >`SELECT get_ticket_stats()`;

  res.json(stats);
});

ticketsRouter.get("/:id", requireAuth, async (req, res) => {
  const id = parseTicketId(req, res);
  if (id === undefined) return;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: {
      id: true,
      subject: true,
      status: true,
      category: true,
      requesterEmail: true,
      requesterName: true,
      createdAt: true,
      updatedAt: true,
      assignedTo: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          senderName: true,
          senderEmail: true,
          senderType: true,
          body: true,
          createdAt: true,
        },
      },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json({ ticket });
});

ticketsRouter.post("/:id/summary", requireAuth, async (req, res) => {
  const id = parseTicketId(req, res);
  if (id === undefined) return;

  const existing = await prisma.ticket.findUnique({
    where: { id },
    select: {
      subject: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { senderName: true, senderType: true, body: true },
      },
    },
  });
  if (!existing) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  try {
    const summary = await summarizeTicket({
      subject: existing.subject,
      messages: existing.messages,
    });
    res.json({ summary });
  } catch (err) {
    console.error("Failed to summarize ticket:", err);
    res.status(502).json({ error: "Failed to summarize ticket" });
  }
});

ticketsRouter.patch("/:id/assign", requireAuth, async (req, res) => {
  const id = parseTicketId(req, res);
  if (id === undefined) return;

  const data = parseBody(assignTicketSchema, req.body, res);
  if (!data) return;

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  if (data.assignedToId) {
    const agent = await prisma.user.findUnique({ where: { id: data.assignedToId } });
    if (!agent || agent.deletedAt || agent.role !== Role.agent) {
      res.status(400).json({ error: "Assignee must be an active agent" });
      return;
    }
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: { assignedToId: data.assignedToId },
    select: { id: true, assignedTo: { select: { id: true, name: true } } },
  });

  res.json({ ticket });
});

ticketsRouter.patch("/:id/status", requireAuth, async (req, res) => {
  const id = parseTicketId(req, res);
  if (id === undefined) return;

  const data = parseBody(updateTicketStatusSchema, req.body, res);
  if (!data) return;

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: { status: data.status },
    select: { id: true, status: true },
  });

  res.json({ ticket });
});

ticketsRouter.patch("/:id/category", requireAuth, async (req, res) => {
  const id = parseTicketId(req, res);
  if (id === undefined) return;

  const data = parseBody(updateTicketCategorySchema, req.body, res);
  if (!data) return;

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: { category: data.category },
    select: { id: true, category: true },
  });

  res.json({ ticket });
});

ticketsRouter.post("/:id/replies/polish", requireAuth, async (req, res) => {
  const id = parseTicketId(req, res);
  if (id === undefined) return;

  const data = parseBody(polishReplySchema, req.body, res);
  if (!data) return;

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  try {
    const body = await polishReply({
      body: data.body,
      requesterName: existing.requesterName,
      agentName: req.user!.name,
    });
    res.json({ body });
  } catch (err) {
    console.error("Failed to polish reply:", err);
    res.status(502).json({ error: "Failed to polish reply" });
  }
});

ticketsRouter.post("/:id/replies", requireAuth, async (req, res) => {
  const id = parseTicketId(req, res);
  if (id === undefined) return;

  const data = parseBody(createReplySchema, req.body, res);
  if (!data) return;

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const [message] = await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderEmail: req.user!.email,
        senderName: req.user!.name,
        body: data.body,
        providerMessageId: `agent-reply:${randomUUID()}`,
        senderType: SenderType.agent,
      },
      select: {
        id: true,
        senderName: true,
        senderEmail: true,
        senderType: true,
        body: true,
        createdAt: true,
      },
    }),
    prisma.ticket.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);

  res.status(201).json({ message });
});
