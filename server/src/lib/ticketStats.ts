export const DAILY_TICKET_COUNTS_DAYS = 30;

export function buildDailyTicketCounts(
  createdAtDates: Date[],
): { date: string; count: number }[] {
  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(startDate.getUTCDate() - (DAILY_TICKET_COUNTS_DAYS - 1));

  const counts = new Map<string, number>();
  for (let i = 0; i < DAILY_TICKET_COUNTS_DAYS; i++) {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + i);
    counts.set(date.toISOString().slice(0, 10), 0);
  }

  for (const createdAt of createdAtDates) {
    const key = createdAt.toISOString().slice(0, 10);
    const current = counts.get(key);
    if (current !== undefined) {
      counts.set(key, current + 1);
    }
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}
