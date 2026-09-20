import { z } from "zod";

export const inboundEmailSchema = z.object({
  senderEmail: z
    .string()
    .min(1, "Sender email is required")
    .max(255, "Sender email must be at most 255 characters")
    .pipe(z.email("Enter a valid sender email address")),
  senderName: z
    .string()
    .trim()
    .min(1, "Sender name is required")
    .max(255, "Sender name must be at most 255 characters"),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(255, "Subject must be at most 255 characters"),
  body: z.string().min(1, "Body is required").max(1000, "Body must be at most 1000 characters"),
  providerMessageId: z
    .string()
    .trim()
    .min(1, "Provider message ID is required")
    .max(255, "Provider message ID must be at most 255 characters"),
});

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>;
