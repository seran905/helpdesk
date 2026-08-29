import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { SortingState } from '@tanstack/react-table'
import { SortOrder, TicketSortField } from 'core'
import TicketsTable, { type Ticket } from '@/components/TicketsTable'
import TicketsToolbar from '@/components/TicketsToolbar'
import { useTicketFilters } from '@/hooks/useTicketFilters'
import { apiClient } from '@/lib/api-client'

function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: TicketSortField.createdAt, desc: true },
  ])
  const sort = sorting[0]
  const sortBy = sort?.id ?? TicketSortField.createdAt
  const sortOrder = sort?.desc === false ? SortOrder.asc : SortOrder.desc

  const {
    status,
    setStatus,
    category,
    setCategory,
    searchInput,
    setSearchInput,
    filterParams,
  } = useTicketFilters()

  const params = { sortBy, sortOrder, ...filterParams }

  const {
    data: tickets,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['tickets', params],
    queryFn: () =>
      apiClient.get('/api/tickets', { params }).then((res) => res.data.tickets as Ticket[]),
  })

  return (
    <div className="px-8 py-10">
      <h1 className="mb-6 text-[32px] font-semibold tracking-tight text-foreground">Tickets</h1>
      <TicketsToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        onStatusChange={setStatus}
        category={category}
        onCategoryChange={setCategory}
      />
      <TicketsTable
        tickets={tickets}
        isPending={isPending}
        isError={isError}
        sorting={sorting}
        onSortingChange={setSorting}
      />
    </div>
  )
}

export default TicketsPage
