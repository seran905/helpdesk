import type { ReactNode } from 'react'
import TicketStatusSelect from '@/components/TicketStatusSelect'
import TicketCategorySelect from '@/components/TicketCategorySelect'
import TicketAssigneeSelect from '@/components/TicketAssigneeSelect'
import type { TicketDetail } from '@/components/TicketDetails'

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="text-muted-foreground">{label}</div>
      {children}
    </div>
  )
}

type UpdateTicketProps = {
  ticket: TicketDetail
}

function UpdateTicket({ ticket }: UpdateTicketProps) {
  return (
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
  )
}

export default UpdateTicket
