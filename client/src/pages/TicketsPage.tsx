import { useQuery } from '@tanstack/react-query'
import TicketsTable, { type Ticket } from '@/components/TicketsTable'
import { apiClient } from '@/lib/api-client'

function TicketsPage() {
  const {
    data: tickets,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => apiClient.get('/api/tickets').then((res) => res.data.tickets as Ticket[]),
  })

  return (
    <div className="px-8 py-10">
      <h1 className="mb-6 text-[32px] font-semibold tracking-tight text-foreground">Tickets</h1>
      <TicketsTable tickets={tickets} isPending={isPending} isError={isError} />
    </div>
  )
}

export default TicketsPage
