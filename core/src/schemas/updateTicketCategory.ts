import { z } from "zod";
import { TicketCategory } from "../ticketCategory.js";

export const updateTicketCategorySchema = z.object({
  category: z.enum(TicketCategory).nullable(),
});

export type UpdateTicketCategoryInput = z.infer<typeof updateTicketCategorySchema>;
