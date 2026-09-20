import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { knowledgeBase } from "./knowledgeBase.js";

export const AI_ASSISTANT_NAME = "AI Assistant";

const autoResolutionSchema = z.object({
  resolved: z.boolean(),
  reply: z.string().nullable(),
});

type AutoResolveTicketOptions = {
  subject: string;
  body: string;
  requesterName: string;
};

export type AutoResolveResult = { resolved: true; reply: string } | { resolved: false };

export async function autoResolveTicket({
  subject,
  body,
  requesterName,
}: AutoResolveTicketOptions): Promise<AutoResolveResult> {
  const requesterFirstName = requesterName.trim().split(/\s+/)[0];

  const { object } = await generateObject({
    model: openai("gpt-5-nano"),
    schema: autoResolutionSchema,
    system:
      "You are an automated support assistant for Code with Seran. Use ONLY the knowledge base below to " +
      "resolve the customer's ticket. Set resolved to true and write a complete, ready-to-send reply ONLY " +
      "if the knowledge base fully and unambiguously answers this ticket. Set resolved to false (and leave " +
      "reply null) if the ticket matches any of the knowledge base's escalation rules, needs information the " +
      "knowledge base doesn't cover, or you are not highly confident in the answer. When in doubt, do not " +
      "resolve — a human agent will handle it.\n\n" +
      "When resolved is true, write the reply as a professional, customer-friendly support email. " +
      `Start the reply with "Hi ${requesterFirstName},". ` +
      "Clearly and warmly answer the question using only the knowledge base, using short paragraphs or a " +
      "hyphen-bulleted list where that improves readability. " +
      `End the reply with a closing salutation (e.g. "Best regards,") followed by "${AI_ASSISTANT_NAME}" on the next line. ` +
      "Return only the reply text with no preamble or explanations.\n\n" +
      `Knowledge base:\n${knowledgeBase}`,
    prompt: `Subject: ${subject}\n\n${body}`,
  });

  if (!object.resolved || !object.reply?.trim()) {
    return { resolved: false };
  }
  return { resolved: true, reply: object.reply.trim() };
}
