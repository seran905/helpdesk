import { Router } from "express";
import { ticketListQuerySchema, TicketSortField } from "core";
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

ticketsRouter.get("/", requireAuth, async (req, res) => {
  const query = parseBody(ticketListQuerySchema, req.query, res);
  if (!query) return;

  const tickets = await prisma.ticket.findMany({
    orderBy: buildOrderBy(query.sortBy, query.sortOrder),
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
