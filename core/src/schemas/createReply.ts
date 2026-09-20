import { z } from "zod";

export const createReplySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Reply cannot be empty")
    .max(1000, "Reply must be at most 1000 characters"),
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;
