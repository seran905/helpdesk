-- Computes the dashboard's ticket stats (totals, AI resolution rate, average
-- resolution time, and a 30-day daily volume series) in a single round trip.
CREATE OR REPLACE FUNCTION get_ticket_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH today AS (
    SELECT (now() AT TIME ZONE 'UTC')::date AS value
  ),
  real_tickets AS (
    SELECT * FROM "ticket" WHERE status NOT IN ('new', 'processing')
  ),
  ai_resolved_tickets AS (
    SELECT DISTINCT t.id
    FROM real_tickets t
    JOIN "ticket_message" m ON m."ticketId" = t.id
    WHERE m."senderType" = 'ai'
  ),
  resolution_times AS (
    SELECT EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) * 1000 AS resolution_ms
    FROM "ticket"
    WHERE status IN ('resolved', 'closed')
  ),
  day_series AS (
    SELECT generate_series(
      (SELECT value FROM today) - INTERVAL '29 days',
      (SELECT value FROM today),
      INTERVAL '1 day'
    )::date AS day
  ),
  daily_counts AS (
    SELECT ds.day, COUNT(t.id) AS count
    FROM day_series ds
    LEFT JOIN "ticket" t ON t."createdAt"::date = ds.day
    GROUP BY ds.day
  ),
  totals AS (
    SELECT
      (SELECT COUNT(*) FROM real_tickets) AS total_tickets,
      (SELECT COUNT(*) FROM "ticket" WHERE status = 'open') AS open_tickets,
      (SELECT COUNT(*) FROM ai_resolved_tickets) AS ai_resolved_tickets
  )
  SELECT jsonb_build_object(
    'totalTickets', totals.total_tickets,
    'openTickets', totals.open_tickets,
    'aiResolvedTickets', totals.ai_resolved_tickets,
    'aiResolvedPercentage', CASE
      WHEN totals.total_tickets = 0 THEN 0
      ELSE (totals.ai_resolved_tickets::numeric / totals.total_tickets) * 100
    END,
    'averageResolutionTimeMs', (SELECT AVG(resolution_ms) FROM resolution_times),
    'dailyTicketCounts', (
      SELECT jsonb_agg(
        jsonb_build_object('date', to_char(day, 'YYYY-MM-DD'), 'count', count)
        ORDER BY day
      )
      FROM daily_counts
    )
  )
  FROM totals;
$$;
