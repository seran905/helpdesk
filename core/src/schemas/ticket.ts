import { z } from "zod";

export const inboundEmailSchema = z.object({
  senderEmail: z
    .string()
    .min(1, "Sender email is required")
    .pipe(z.email("Enter a valid sender email address")),
  senderName: z.string().trim().min(1, "Sender name is required"),
  subject: z.string().trim().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  providerMessageId: z.string().trim().min(1, "Provider message ID is required"),
});

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>;
