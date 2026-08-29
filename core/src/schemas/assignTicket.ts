import { z } from "zod";

export const assignTicketSchema = z.object({
  assignedToId: z.string().min(1, "assignedToId cannot be empty").nullable(),
});

export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
