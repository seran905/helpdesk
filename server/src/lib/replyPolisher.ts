import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

type PolishReplyOptions = {
  body: string;
  requesterName: string;
  agentName: string;
};

export async function polishReply({
  body,
  requesterName,
  agentName,
}: PolishReplyOptions): Promise<string> {
  const requesterFirstName = requesterName.trim().split(/\s+/)[0];

  const { text } = await generateText({
    model: openai("gpt-5-nano"),
    system:
      "You are a helpful assistant for a customer support team. " +
      "Improve the given reply for clarity, professional tone, and grammar. " +
      "Preserve the original meaning and keep the response concise. " +
      `Start the reply with "Dear ${requesterFirstName},". ` +
      `End the reply with a closing salutation (e.g. "Regards,") followed by the agent's name, "${agentName}", on the next line. ` +
      "Return only the improved text with no preamble or explanations.",
    prompt: body,
  });

  return text.trim();
}