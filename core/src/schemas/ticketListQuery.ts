import { z } from "zod";
import { SortOrder, TicketSortField } from "../ticketSort.js";

export const ticketListQuerySchema = z.object({
  sortBy: z.enum(TicketSortField).default(TicketSortField.createdAt),
  sortOrder: z.enum(SortOrder).default(SortOrder.desc),
});

export type TicketListQuery = z.infer<typeof ticketListQuerySchema>;
