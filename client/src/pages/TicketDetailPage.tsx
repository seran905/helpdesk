import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import TicketHeader from '@/components/TicketHeader'
import TicketSummary from '@/components/TicketSummary'
import ConversationTimeline from '@/components/ConversationTimeline'
import CasePanel from '@/components/CasePanel'
import ReplyForm from '@/components/ReplyForm'
import BackLink from '@/components/BackLink'
import TicketDetailSkeleton from '@/components/TicketDetailSkeleton'
import { apiClient } from '@/lib/api-client'
import type { TicketDetail } from '@/types/ticket'

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
    return <TicketDetailSkeleton />
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

      <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-3">
        <div className="space-y-8 sm:col-span-2">
          <TicketHeader ticket={ticket} />

          <div>
            <h2 className="mb-4 text-[15px] font-semibold text-foreground">Conversation</h2>
            <div className="mb-6">
              <TicketSummary ticketId={String(ticket.id)} />
            </div>
            <ConversationTimeline messages={ticket.messages} />
          </div>

          <ReplyForm ticketId={String(ticket.id)} />
        </div>

        <CasePanel ticket={ticket} />
      </div>
    </div>
  )
}

export default TicketDetailPage
