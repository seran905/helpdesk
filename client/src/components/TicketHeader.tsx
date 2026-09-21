import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { TicketDetail } from '@/types/ticket'

type TicketHeaderProps = {
  ticket: TicketDetail
}

function initials(name: string) {
  const [first, second] = name.trim().split(/\s+/)
  return ((first?.[0] ?? '') + (second?.[0] ?? '')).toUpperCase()
}

function TicketHeader({ ticket }: TicketHeaderProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback className="bg-muted pt-px leading-none font-semibold text-muted-foreground">
            {initials(ticket.requesterName)}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm text-muted-foreground">{ticket.requesterName}</p>
      </div>
      <h1 className="mt-1 text-[34px] leading-[1.15] font-bold tracking-tight text-foreground">
        {ticket.subject}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{ticket.requesterEmail}</p>
    </div>
  )
}

export default TicketHeader
