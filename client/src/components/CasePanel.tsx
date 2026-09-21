import type { ReactNode } from 'react'
import TicketStatusSelect from '@/components/TicketStatusSelect'
import TicketCategorySelect from '@/components/TicketCategorySelect'
import TicketAssigneeSelect from '@/components/TicketAssigneeSelect'
import { formatDateTime } from '@/lib/formatDate'
import type { TicketDetail } from '@/types/ticket'

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  )
}

type CasePanelProps = {
  ticket: TicketDetail
}

function CasePanel({ ticket }: CasePanelProps) {
  return (
    <div
      data-slot="case-panel"
      className="space-y-4 rounded-md border border-border bg-muted/40 p-4 sm:sticky sm:top-24 sm:w-fit sm:self-start"
    >
      <FieldRow label="Status">
        <TicketStatusSelect ticketId={String(ticket.id)} status={ticket.status} />
      </FieldRow>

      <div className="h-px bg-border" />

      <FieldRow label="Category">
        <TicketCategorySelect ticketId={String(ticket.id)} category={ticket.category} />
      </FieldRow>

      <div className="h-px bg-border" />

      <FieldRow label="Assigned to">
        <TicketAssigneeSelect ticketId={String(ticket.id)} assignedTo={ticket.assignedTo} />
      </FieldRow>

      <div className="h-px bg-border" />

      <div className="space-y-1 text-xs text-muted-foreground">
        <div>Ticket #{ticket.id}</div>
        <div>Opened {formatDateTime(ticket.createdAt)}</div>
        <div>Updated {formatDateTime(ticket.updatedAt)}</div>
      </div>
    </div>
  )
}

export default CasePanel
