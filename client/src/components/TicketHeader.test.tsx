import { TicketCategory, TicketStatus } from 'core'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TicketHeader from '@/components/TicketHeader'
import type { TicketDetail } from '@/types/ticket'

const ticket: TicketDetail = {
  id: 1,
  subject: 'Cannot log in',
  status: TicketStatus.open,
  category: TicketCategory.technical_question,
  requesterEmail: 'jane@example.com',
  requesterName: 'Jane Doe',
  createdAt: '2026-08-29T00:00:00.000Z',
  updatedAt: '2026-08-29T01:00:00.000Z',
  assignedTo: { id: 'u1', name: 'Agent Smith' },
  messages: [],
}

describe('TicketHeader', () => {
  it('renders the subject as a heading, with the requester name and email', () => {
    render(<TicketHeader ticket={ticket} />)

    expect(screen.getByRole('heading', { name: 'Cannot log in' })).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })
})
