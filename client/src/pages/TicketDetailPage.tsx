import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TicketCategory, TicketStatus } from 'core'
import TicketStatusBadge from '@/components/TicketStatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'

type TicketMessage = {
  id: number
  senderName: string
  senderEmail: string
  body: string
  createdAt: string
}

type TicketDetail = {
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

function BackLink() {
  return (
    <Link
      to="/tickets"
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to tickets
    </Link>
  )
}

function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()

  const {
    data: ticket,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () =>
      apiClient.get(`/api/tickets/${id}`).then((res) => res.data.ticket as TicketDetail),
  })

  if (isPending) {
    return (
      <div className="px-8 py-10">
        <BackLink />
        <Skeleton className="mb-2 h-9 w-96" />
        <Skeleton className="mb-8 h-24 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    )
  }

  if (isError || !ticket) {
    return (
      <div className="px-8 py-10">
        <BackLink />
        <p className="text-sm text-destructive">Failed to load ticket.</p>
      </div>
    )
  }

  return (
    <div className="px-8 py-10">
      <BackLink />

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
          {ticket.subject}
        </h1>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-x-8 gap-y-4 rounded-md border border-border bg-muted/40 p-4 text-sm sm:grid-cols-4">
        <div>
          <div className="text-xs text-muted-foreground">Requester</div>
          <div className="text-foreground">{ticket.requesterName}</div>
          <div className="text-xs text-muted-foreground">{ticket.requesterEmail}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Category</div>
          <div className="text-foreground capitalize">
            {ticket.category ? ticket.category.replace(/_/g, ' ') : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Assigned To</div>
          <div className="text-foreground">{ticket.assignedTo?.name ?? 'Unassigned'}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Created</div>
          <div className="text-foreground">{new Date(ticket.createdAt).toLocaleString()}</div>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-foreground">Messages</h2>
      {ticket.messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <div className="space-y-4">
          {ticket.messages.map((message) => (
            <div key={message.id} className="rounded-md border border-border p-4">
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <div>
                  <span className="font-medium text-foreground">{message.senderName}</span>{' '}
                  <span className="text-xs text-muted-foreground">{message.senderEmail}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{message.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TicketDetailPage
