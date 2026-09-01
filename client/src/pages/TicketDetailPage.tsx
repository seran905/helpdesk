import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TicketCategory, TicketStatus } from 'core'
import TicketStatusSelect from '@/components/TicketStatusSelect'
import TicketCategorySelect from '@/components/TicketCategorySelect'
import TicketAssigneeSelect from '@/components/TicketAssigneeSelect'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'

type TicketMessage = {
  id: number
  senderName: string
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

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="text-muted-foreground">{label}</div>
      {children}
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/tickets" className="link-muted mb-6 inline-flex items-center gap-1.5 text-sm">
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

      <h1 className="mb-6 text-[32px] font-semibold tracking-tight text-foreground">
        {ticket.subject}
      </h1>

      <div className="grid grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-3">
        <div className="space-y-3 sm:col-span-2">
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
            <h2 className="mb-3 text-lg font-semibold text-foreground">Messages</h2>
            {ticket.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              <div className="space-y-4">
                {ticket.messages.map((message) => (
                  <div key={message.id} className="rounded-md border border-border p-4">
                    <div className="mb-2 flex items-baseline justify-between gap-4">
                      <span className="font-medium text-foreground">{message.senderName}</span>
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
        </div>
        <div className="space-y-3">
          <FieldRow label="Status">
            <TicketStatusSelect ticketId={String(ticket.id)} status={ticket.status} />
          </FieldRow>
          <FieldRow label="Category">
            <TicketCategorySelect ticketId={String(ticket.id)} category={ticket.category} />
          </FieldRow>
          <FieldRow label="Assigned To">
            <TicketAssigneeSelect ticketId={String(ticket.id)} assignedTo={ticket.assignedTo} />
          </FieldRow>
        </div>
      </div>
    </div>
  )
}

export default TicketDetailPage
