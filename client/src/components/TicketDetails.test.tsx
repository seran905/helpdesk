import { SenderType, TicketCategory, TicketStatus } from 'core'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TicketDetails from '@/components/TicketDetails'
import type { TicketDetail } from '@/types/ticket'

const baseTicket: TicketDetail = {
  id: 1,
  subject: 'Cannot log in',
  status: TicketStatus.open,
  category: TicketCategory.technical_question,
  requesterEmail: 'jane@example.com',
  requesterName: 'Jane Doe',
  createdAt: '2026-08-29T00:00:00.000Z',
  updatedAt: '2026-08-29T01:00:00.000Z',
  assignedTo: { id: 'u1', name: 'Agent Smith' },
  messages: [
    {
      id: 1,
      senderName: 'Jane Doe',
      senderType: SenderType.customer,
      body: "I can't log in to my account.",
      createdAt: '2026-08-29T00:15:00.000Z',
    },
    {
      id: 2,
      senderName: 'Agent Smith',
      senderType: SenderType.agent,
      body: 'Can you try resetting your password?',
      createdAt: '2026-08-29T00:30:00.000Z',
    },
  ],
}

describe('TicketDetails', () => {
  it('renders the subject, requester, and dates', () => {
    render(<TicketDetails ticket={baseTicket} />)

    expect(screen.getByRole('heading', { name: 'Cannot log in' })).toBeInTheDocument()
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0)
    expect(screen.getByText(/jane@example\.com/)).toBeInTheDocument()
    expect(
      screen.getByText(new Date(baseTicket.createdAt).toLocaleString()),
    ).toBeInTheDocument()
    expect(
      screen.getByText(new Date(baseTicket.updatedAt).toLocaleString()),
    ).toBeInTheDocument()
  })

  it('renders only the original message, not later replies', () => {
    render(<TicketDetails ticket={baseTicket} />)

    expect(screen.getByText("I can't log in to my account.")).toBeInTheDocument()
    expect(screen.queryByText('Can you try resetting your password?')).not.toBeInTheDocument()
  })

  it('shows a fallback when there are no messages', () => {
    render(<TicketDetails ticket={{ ...baseTicket, messages: [] }} />)

    expect(screen.getByText('No message yet.')).toBeInTheDocument()
  })
})
