import { prisma } from "./prisma.js";

export const AI_AGENT_EMAIL = "ai@helpdesk.local";
export const AI_AGENT_NAME = "AI";

export async function getAiAgentId(): Promise<string> {
  const aiAgent = await prisma.user.findUniqueOrThrow({
    where: { email: AI_AGENT_EMAIL },
    select: { id: true },
  });
  return aiAgent.id;
}
