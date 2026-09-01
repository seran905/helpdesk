import { Router } from "express";
import { inboundEmailSchema, TicketStatus } from "core";
import { prisma } from "../lib/prisma.js";
import { parseBody } from "../lib/validate.js";
import { requireWebhookSecret } from "../middleware/requireWebhookSecret.js";
import { SenderType } from "../generated/prisma/enums.js";
import { enqueueTicketClassification } from "../lib/ticketClassificationQueue.js";

export const webhooksRouter = Router();

function normalizeSubject(subject: string): string {
  let s = subject.trim().toLowerCase();
  let prev;
  do {
    prev = s;
    s = s.replace(/^(re|fwd?|fw):\s*/i, "");
  } while (s !== prev);
  return s;
}

webhooksRouter.post("/inbound-email", requireWebhookSecret, async (req, res) => {
  const data = parseBody(inboundEmailSchema, req.body, res);
  if (!data) return;
  const { senderEmail, senderName, subject, body, providerMessageId } = data;

  const existingMessage = await prisma.ticketMessage.findUnique({
    where: { providerMessageId },
    include: { ticket: true },
  });
  if (existingMessage) {
    const { ticket, ...message } = existingMessage;
    res.status(200).json({ ticket, message });
    return;
  }

  const normalizedSubject = normalizeSubject(subject);

  let ticket = await prisma.ticket.findFirst({
    where: { requesterEmail: senderEmail, normalizedSubject },
    orderBy: { createdAt: "desc" },
  });

  const isNewTicket = !ticket;

  if (!ticket) {
    ticket = await prisma.ticket.create({
      data: {
        subject,
        normalizedSubject,
        status: TicketStatus.open,
        requesterEmail: senderEmail,
        requesterName: senderName,
      },
    });
  } else {
    await prisma.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } });
  }

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderEmail,
      senderName,
      body,
      providerMessageId,
      senderType: SenderType.customer,
    },
  });

  res.status(201).json({ ticket, message });

  if (isNewTicket) {
    enqueueTicketClassification({ ticketId: ticket.id, subject, body }).catch((err) => {
      console.error("Failed to enqueue ticket classification:", err);
    });
  }
});
