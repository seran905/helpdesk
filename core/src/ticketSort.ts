export const TicketSortField = {
  subject: "subject",
  requesterName: "requesterName",
  status: "status",
  category: "category",
  assignedTo: "assignedTo",
  createdAt: "createdAt",
} as const;

export type TicketSortField = (typeof TicketSortField)[keyof typeof TicketSortField];

export const SortOrder = {
  asc: "asc",
  desc: "desc",
} as const;

export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
