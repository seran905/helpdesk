import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { TicketCategory } from "core";

type ClassifyTicketOptions = {
  subject: string;
  body: string;
};

const CATEGORY_VALUES = Object.values(TicketCategory);

export async function classifyTicket({
  subject,
  body,
}: ClassifyTicketOptions): Promise<TicketCategory | null> {
  const { text } = await generateText({
    model: openai("gpt-5-nano"),
    system:
      "You classify customer support tickets into exactly one category. " +
      `The valid categories are: ${CATEGORY_VALUES.join(", ")}. ` +
      "Return only the category value with no preamble, explanation, or punctuation.",
    prompt: `Subject: ${subject}\n\n${body}`,
  });

  const category = text.trim() as TicketCategory;
  return CATEGORY_VALUES.includes(category) ? category : null;
}
