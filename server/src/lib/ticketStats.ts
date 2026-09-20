export type TicketStats = {
  totalTickets: number;
  openTickets: number;
  aiResolvedTickets: number;
  aiResolvedPercentage: number;
  averageResolutionTimeMs: number | null;
  dailyTicketCounts: { date: string; count: number }[];
};
