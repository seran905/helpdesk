import type { ReactNode } from 'react'
import type { SenderType, TicketCategory, TicketStatus } from 'core'

export type TicketMessage = {
  id: number
  senderName: string
  senderType: SenderType
  body: string
  createdAt: string
}

export type TicketDetail = {
  id: number
  subject: string
  status: TicketStatus
  category: TicketCategory | null
  requesterEmail: string
  requesterName: string
  createdAt: string
  updatedAt: string
  assignedTo: { id: string; name: string } | null
  messages: TicketMessage[]
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

type TicketDetailsProps = {
  ticket: TicketDetail
}

function TicketDetails({ ticket }: TicketDetailsProps) {
  const [originalMessage] = ticket.messages

  return (
    <>
      <h1 className="mb-6 text-[32px] font-semibold tracking-tight text-foreground">
        {ticket.subject}
      </h1>

      <DetailRow
        label="Requester"
        value={
          <>
            {ticket.requesterName}
            <span className="ml-1.5 text-muted-foreground">({ticket.requesterEmail})</span>
          </>
        }
      />
      <DetailRow label="Created" value={new Date(ticket.createdAt).toLocaleString()} />
      <DetailRow label="Updated" value={new Date(ticket.updatedAt).toLocaleString()} />

      <div className="pt-2">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Message</h2>
        {originalMessage ? (
          <div className="rounded-md border border-border p-4">
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <span className="font-medium text-foreground">{originalMessage.senderName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(originalMessage.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground">{originalMessage.body}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No message yet.</p>
        )}
      </div>
    </>
  )
}

export default TicketDetails
