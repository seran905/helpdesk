import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import TicketDetails, { type TicketDetail } from '@/components/TicketDetails'
import UpdateTicket from '@/components/UpdateTicket'
import ReplyThread from '@/components/ReplyThread'
import ReplyForm from '@/components/ReplyForm'
import BackLink from '@/components/BackLink'
import TicketDetailSkeleton from '@/components/TicketDetailSkeleton'
import { apiClient } from '@/lib/api-client'

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

  const replies = ticket.messages.slice(1)

  return (
    <div className="px-8 py-10">
      <BackLink />

      <div className="grid grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-3">
        <div className="space-y-3 sm:col-span-2">
          <TicketDetails ticket={ticket} />
          <ReplyThread replies={replies} />
          <ReplyForm ticketId={String(ticket.id)} />
        </div>
        <UpdateTicket ticket={ticket} />
      </div>
    </div>
  )
}

export default TicketDetailPage
