import { TicketCategory, TicketStatus } from 'core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { apiClient } from '@/lib/api-client'
import { renderTicketsPage } from '@/test/renderTicketsPage'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

const mockTickets = [
  {
    id: 1,
    subject: 'Cannot log in',
    status: TicketStatus.open,
    category: TicketCategory.technical_question,
    requesterEmail: 'jane@example.com',
    requesterName: 'Jane Doe',
    createdAt: '2026-08-29T00:00:00.000Z',
    assignedTo: { id: 'u1', name: 'Agent Smith' },
  },
  {
    id: 2,
    subject: 'Refund please',
    status: TicketStatus.resolved,
    category: null,
    requesterEmail: 'bob@example.com',
    requesterName: 'Bob Jones',
    createdAt: '2026-08-28T00:00:00.000Z',
    assignedTo: null,
  },
]

describe('TicketsPage', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
  })

  it('shows a skeleton table while the request is pending', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}))
    const { container } = renderTicketsPage()

    expect(screen.getByRole('heading', { name: 'Tickets' })).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(screen.queryByText('Cannot log in')).not.toBeInTheDocument()
  })

  it('shows an error message when the request fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('network error'))
    renderTicketsPage()

    expect(await screen.findByText('Failed to load tickets.')).toBeInTheDocument()
  })

  it('shows an empty state when there are no tickets', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { tickets: [] } })
    renderTicketsPage()

    expect(await screen.findByText('No tickets found.')).toBeInTheDocument()
  })

  it('renders each ticket with subject, requester, status, category, assignee, and created date', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { tickets: mockTickets } })
    renderTicketsPage()

    expect(await screen.findByText('Cannot log in')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText(TicketStatus.open)).toBeInTheDocument()
    expect(screen.getByText('technical question')).toBeInTheDocument()
    expect(screen.getByText('Agent Smith')).toBeInTheDocument()
    expect(
      screen.getByText(new Date(mockTickets[0].createdAt).toLocaleDateString()),
    ).toBeInTheDocument()

    expect(screen.getByText('Refund please')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText(TicketStatus.resolved)).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
  })

  it('fetches from /api/tickets sorted by createdAt desc by default', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { tickets: mockTickets } })
    renderTicketsPage()

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', {
        params: { sortBy: 'createdAt', sortOrder: 'desc' },
      }),
    )
  })

  it('refetches with the clicked column when a sortable header is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { tickets: mockTickets } })
    renderTicketsPage()

    const user = userEvent.setup()
    await screen.findByText('Cannot log in')

    await user.click(screen.getByRole('button', { name: /subject/i }))

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', {
        params: { sortBy: 'subject', sortOrder: 'asc' },
      }),
    )

    await user.click(screen.getByRole('button', { name: /subject/i }))

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', {
        params: { sortBy: 'subject', sortOrder: 'desc' },
      }),
    )
  })
})
