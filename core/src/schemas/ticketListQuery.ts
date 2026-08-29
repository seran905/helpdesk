import { z } from "zod";
import { SortOrder, TicketSortField } from "../ticketSort.js";
import { TicketCategoryFilter } from "../ticketCategoryFilter.js";
import { TicketStatus } from "../ticketStatus.js";

export const ticketListQuerySchema = z.object({
  sortBy: z.enum(TicketSortField).default(TicketSortField.createdAt),
  sortOrder: z.enum(SortOrder).default(SortOrder.desc),
  status: z.enum(TicketStatus).optional(),
  category: z.enum(TicketCategoryFilter).optional(),
  search: z.string().trim().min(1).optional(),
});

export type TicketListQuery = z.infer<typeof ticketListQuerySchema>;
