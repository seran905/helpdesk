import { TicketCategory } from "./ticketCategory.js";

export const TicketCategoryFilter = {
  ...TicketCategory,
  uncategorized: "uncategorized",
} as const;

export type TicketCategoryFilter = (typeof TicketCategoryFilter)[keyof typeof TicketCategoryFilter];
