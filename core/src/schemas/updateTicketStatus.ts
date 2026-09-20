import { z } from "zod";
import { TicketStatus } from "../ticketStatus.js";

export const updateTicketStatusSchema = z.object({
  status: z.enum(TicketStatus),
});

export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
