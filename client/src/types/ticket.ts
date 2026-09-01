import type { SenderType, TicketCategory, TicketStatus } from 'core'

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

export type TicketMessage = {
  id: number
  senderName: string
  senderType: SenderType
  body: string
  createdAt: string
}

export type TicketDetail = Ticket & {
  updatedAt: string
  messages: TicketMessage[]
}
