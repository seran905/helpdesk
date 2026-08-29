import { TicketStatus } from 'core'

const statusBadgeColors: Record<TicketStatus, string> = {
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
