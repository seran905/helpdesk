import { TicketStatus } from 'core'

export const statusBadgeColors: Record<TicketStatus, string> = {
  [TicketStatus.new]: 'border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  [TicketStatus.processing]:
    'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  [TicketStatus.open]: 'border-primary/25 bg-primary/10 text-primary',
  [TicketStatus.resolved]:
    'border-green-500/25 bg-green-500/10 text-green-600 dark:text-green-400',
  [TicketStatus.closed]: 'border-border bg-muted text-muted-foreground',
}

type TicketStatusBadgeProps = {
  status: TicketStatus
}

function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
        statusBadgeColors[status] ?? statusBadgeColors[TicketStatus.open]
      }`}
    >
      {status}
    </span>
  )
}

export default TicketStatusBadge
