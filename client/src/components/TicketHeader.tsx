import type { TicketDetail } from '@/types/ticket'

type TicketHeaderProps = {
  ticket: TicketDetail
}

function TicketHeader({ ticket }: TicketHeaderProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{ticket.requesterName}</p>
      <h1 className="mt-1 text-[34px] leading-[1.15] font-bold tracking-tight text-foreground">
        {ticket.subject}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{ticket.requesterEmail}</p>
    </div>
  )
}

export default TicketHeader
