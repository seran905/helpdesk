import { randomUUID } from "node:crypto";
import { TicketStatus } from "core";
import { boss } from "./queue.js";
import { prisma } from "./prisma.js";
import { AI_ASSISTANT_NAME, autoResolveTicket } from "./ticketAutoResolver.js";
import { getAiAgentId } from "./aiAgent.js";
import { SenderType } from "../generated/prisma/enums.js";

export const AUTO_RESOLVE_TICKET_QUEUE = "auto-resolve-ticket";

const AI_ASSISTANT_EMAIL = "ai-assistant@helpdesk.local";

type AutoResolveTicketJobData = {
  ticketId: number;
  subject: string;
  body: string;
  requesterName: string;
};

export async function startTicketAutoResolveWorker() {
  await boss.createQueue(AUTO_RESOLVE_TICKET_QUEUE, {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  });

  await boss.work<AutoResolveTicketJobData>(AUTO_RESOLVE_TICKET_QUEUE, async ([job]) => {
    const { ticketId, subject, body, requesterName } = job.data;

    try {
      const aiAgentId = await getAiAgentId();

      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.processing, assignedToId: aiAgentId },
      });

      const result = await autoResolveTicket({ subject, body, requesterName });

      if (result.resolved) {
        await prisma.$transaction([
          prisma.ticketMessage.create({
            data: {
              ticketId,
              senderEmail: AI_ASSISTANT_EMAIL,
              senderName: AI_ASSISTANT_NAME,
              senderType: SenderType.ai,
              body: result.reply,
              providerMessageId: `ai-reply:${randomUUID()}`,
            },
          }),
          prisma.ticket.update({
            where: { id: ticketId },
            data: { status: TicketStatus.resolved, updatedAt: new Date() },
          }),
        ]);
      } else {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.open, assignedToId: null },
        });
      }
    } catch (err) {
      console.error("Failed to auto-resolve ticket:", err);
      await prisma.ticket
        .update({ where: { id: ticketId }, data: { status: TicketStatus.open, assignedToId: null } })
        .catch((updateErr) => {
          console.error("Failed to reset ticket status after auto-resolve failure:", updateErr);
        });
      throw err;
    }
  });
}

export function enqueueTicketAutoResolve(data: AutoResolveTicketJobData) {
  return boss.send(AUTO_RESOLVE_TICKET_QUEUE, data);
}
