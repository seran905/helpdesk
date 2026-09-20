import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

type TicketMessage = {
  senderName: string;
  senderType: string;
  body: string;
};

type SummarizeTicketOptions = {
  subject: string;
  messages: TicketMessage[];
};

export async function summarizeTicket({
  subject,
  messages,
}: SummarizeTicketOptions): Promise<string> {
  const transcript = messages
    .map((message) => `${message.senderType} (${message.senderName}): ${message.body}`)
    .join("\n\n");

  const { text } = await generateText({
    model: openai("gpt-5-nano"),
    system:
      "You are a helpful assistant for a customer support team. " +
      "Summarize the ticket below for an agent skimming the case. " +
      "Cover what the customer needs, the key points raised so far, and the current state of the conversation. " +
      "Keep it concise (2-4 sentences). " +
      "Return only the summary with no preamble or explanations.",
    prompt: `Subject: ${subject}\n\n${transcript}`,
  });

  return text.trim();
}
