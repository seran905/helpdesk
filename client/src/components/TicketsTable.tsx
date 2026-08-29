import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table'
import { TicketCategory, TicketSortField, TicketStatus } from 'core'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import TicketStatusBadge from '@/components/TicketStatusBadge'
import TicketCategoryBadge from '@/components/TicketCategoryBadge'

export type Ticket = {
  id: number
  subject: string
  status: TicketStatus
  category: TicketCategory | null
  requesterEmail: string
  requesterName: string
  createdAt: string
  assignedTo: { id: string; name: string } | null
}

const features = tableFeatures({ rowSortingFeature })

const columnHelper = createColumnHelper<typeof features, Ticket>()

const columns = columnHelper.columns([
  columnHelper.accessor('subject', {
    id: TicketSortField.subject,
    header: 'Subject',
    cell: (info) => (
      <Link to={`/tickets/${info.row.original.id}`} className="link font-medium">
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('requesterName', {
    id: TicketSortField.requesterName,
    header: 'Requester',
    cell: (info) => (
      <div className="flex flex-col">
        <span>{info.getValue()}</span>
        <span className="text-xs text-muted-foreground">{info.row.original.requesterEmail}</span>
      </div>
    ),
  }),
  columnHelper.accessor('status', {
    id: TicketSortField.status,
    header: 'Status',
    cell: (info) => <TicketStatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor('category', {
    id: TicketSortField.category,
    header: 'Category',
    cell: (info) => {
      const category = info.getValue()
      return category ? (
        <TicketCategoryBadge category={category} />
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  }),
  columnHelper.accessor((row) => row.assignedTo?.name, {
    id: TicketSortField.assignedTo,
    header: 'Assigned To',
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue() ?? 'Unassigned'}</span>
    ),
  }),
  columnHelper.accessor('createdAt', {
    id: TicketSortField.createdAt,
    header: 'Created',
    cell: (info) => (
      <span className="text-muted-foreground">{new Date(info.getValue()).toLocaleDateString()}</span>
    ),
  }),
])

const columnHeaders = [
  'Subject',
  'Requester',
  'Status',
  'Category',
  'Assigned To',
  'Created',
]

type TicketsTableProps = {
  tickets: Ticket[] | undefined
  isPending: boolean
  isError: boolean
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
}

function TicketsTable({ tickets, isPending, isError, sorting, onSortingChange }: TicketsTableProps) {
  const table = useTable({
    features,
    columns,
    data: tickets ?? [],
    manualSorting: true,
    enableMultiSort: false,
    state: { sorting },
    onSortingChange,
  })

  if (isPending) {
    return (
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columnHeaders.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load tickets.</p>
  }

  if (!tickets || tickets.length === 0) {
    return <p className="text-sm text-muted-foreground">No tickets found.</p>
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortDirection = header.column.getIsSorted()
                return (
                  <TableHead key={header.id}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-7 px-3 text-xs font-medium text-foreground hover:text-foreground"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <table.FlexRender header={header} />
                      {sortDirection === 'asc' ? (
                        <ArrowUp />
                      ) : sortDirection === 'desc' ? (
                        <ArrowDown />
                      ) : (
                        <ArrowUpDown className="opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default TicketsTable
