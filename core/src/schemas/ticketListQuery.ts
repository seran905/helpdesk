import { z } from "zod";
import { SortOrder, TicketSortField } from "../ticketSort.js";
import { TicketCategoryFilter } from "../ticketCategoryFilter.js";
import { TicketStatus } from "../ticketStatus.js";

export const DEFAULT_TICKET_PAGE_SIZE = 10;

export const ticketListQuerySchema = z.object({
  sortBy: z.enum(TicketSortField).default(TicketSortField.createdAt),
  sortOrder: z.enum(SortOrder).default(SortOrder.desc),
  status: z.enum(TicketStatus).optional(),
  category: z.enum(TicketCategoryFilter).optional(),
  search: z.string().trim().min(1).optional(),
  pageIndex: z.coerce.number().int().nonnegative().default(0),
  pageSize: z.coerce.number().int().positive().max(100).default(DEFAULT_TICKET_PAGE_SIZE),
});

export type TicketListQuery = z.infer<typeof ticketListQuerySchema>;
