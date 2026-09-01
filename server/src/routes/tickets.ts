import { Router } from "express";
import type { Request, Response } from "express";
import {
  assignTicketSchema,
  ticketListQuerySchema,
  updateTicketCategorySchema,
  updateTicketStatusSchema,
  TicketCategoryFilter,
  TicketSortField,
  type TicketListQuery,
} from "core";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { parseBody } from "../lib/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Role } from "../generated/prisma/enums.js";

export const ticketsRouter = Router();

function parseTicketId(req: Request, res: Response): number | undefined {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid ticket id" });
    return undefined;
  }
  return id;
}

function buildOrderBy(
  sortBy: TicketSortField,
  sortOrder: Prisma.SortOrder,
): Prisma.TicketOrderByWithRelationInput {
  if (sortBy === TicketSortField.assignedTo) {
    return { assignedTo: { name: sortOrder } };
  }
  return { [sortBy]: sortOrder };
}

function buildWhere(query: TicketListQuery): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.category === TicketCategoryFilter.uncategorized) {
    where.category = null;
  } else if (query.category) {
    where.category = query.category;
  }

  if (query.search) {
    where.OR = [
      { subject: { contains: query.search, mode: "insensitive" } },
      { requesterName: { contains: query.search, mode: "insensitive" } },
      { requesterEmail: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

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
