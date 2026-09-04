import { AI_PROCESSING_STATUSES, TicketCategoryFilter, TicketSortField, type TicketListQuery } from "core";
import type { Prisma } from "../generated/prisma/client.js";

export function buildOrderBy(
  sortBy: TicketSortField,
  sortOrder: Prisma.SortOrder,
): Prisma.TicketOrderByWithRelationInput {
  if (sortBy === TicketSortField.assignedTo) {
    return { assignedTo: { name: sortOrder } };
  }
  return { [sortBy]: sortOrder };
}

export function buildWhere(query: TicketListQuery): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};

  if (query.status) {
    where.status = query.status;
  } else {
    where.status = { notIn: [...AI_PROCESSING_STATUSES] };
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
