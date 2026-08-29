import { TicketCategory, TicketStatus } from 'core'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

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

const statusBadgeColors: Record<TicketStatus, string> = {
  [TicketStatus.open]: 'border-primary/25 bg-primary/10 text-primary',
  [TicketStatus.resolved]: 'border-border bg-muted text-muted-foreground',
  [TicketStatus.closed]: 'border-border bg-muted text-muted-foreground',
}

type TicketsTableProps = {
  tickets: Ticket[] | undefined
  isPending: boolean
  isError: boolean
}

function TicketsTable({ tickets, isPending, isError }: TicketsTableProps) {
  if (isPending) {
    return (
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
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
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Requester</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-medium">{ticket.subject}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{ticket.requesterName}</span>
                  <span className="text-xs text-muted-foreground">{ticket.requesterEmail}</span>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                    statusBadgeColors[ticket.status] ?? statusBadgeColors[TicketStatus.open]
                  }`}
                >
                  {ticket.status}
                </span>
              </TableCell>
              <TableCell>
                {ticket.category ? (
                  <span className="text-sm capitalize text-foreground">
                    {ticket.category.replace(/_/g, ' ')}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {ticket.assignedTo?.name ?? 'Unassigned'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default TicketsTable
