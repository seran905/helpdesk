export const TicketStatus = {
  new: "new",
  processing: "processing",
  open: "open",
  resolved: "resolved",
  closed: "closed",
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

// Transient states a ticket sits in while the AI auto-resolve pipeline is working on it.
// Tickets in these states are hidden from the ticket list and not manually settable.
export const AI_PROCESSING_STATUSES = [TicketStatus.new, TicketStatus.processing] as const;
