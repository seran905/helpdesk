import { boss } from "./queue.js";
import { prisma } from "./prisma.js";
import { classifyTicket } from "./ticketClassifier.js";

export const CLASSIFY_TICKET_QUEUE = "classify-ticket";

type ClassifyTicketJobData = {
  ticketId: number;
  subject: string;
  body: string;
};

export async function startTicketClassificationWorker() {
  await boss.createQueue(CLASSIFY_TICKET_QUEUE, {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  });

  await boss.work<ClassifyTicketJobData>(CLASSIFY_TICKET_QUEUE, async ([job]) => {
    const { ticketId, subject, body } = job.data;

    try {
      const category = await classifyTicket({ subject, body });
      if (!category) return;
      await prisma.ticket.update({ where: { id: ticketId }, data: { category } });
    } catch (err) {
      console.error("Failed to classify ticket:", err);
      throw err;
    }
  });
}

export function enqueueTicketClassification(data: ClassifyTicketJobData) {
  return boss.send(CLASSIFY_TICKET_QUEUE, data);
}
