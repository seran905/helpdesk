import { Router } from "express";
import { ticketListQuerySchema, TicketCategoryFilter, TicketSortField, type TicketListQuery } from "core";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { parseBody } from "../lib/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const ticketsRouter = Router();

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
