import { z } from "zod";

export const polishReplySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Reply cannot be empty")
    .max(1000, "Reply must be at most 1000 characters"),
});

export type PolishReplyInput = z.infer<typeof polishReplySchema>;
