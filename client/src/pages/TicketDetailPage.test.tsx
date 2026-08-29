import { TicketCategory, TicketStatus } from 'core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { apiClient } from '@/lib/api-client'
import { renderTicketDetailPage } from '@/test/renderTicketDetailPage'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}))

const mockTicket = {
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
      body: "I can't log in to my account.",
      createdAt: '2026-08-29T00:00:00.000Z',
    },
    {
      id: 2,
      senderName: 'Agent Smith',
      body: 'Can you try resetting your password?',
      createdAt: '2026-08-29T00:30:00.000Z',
    },
  ],
}

const mockAgents = [
  { id: 'u1', name: 'Agent Smith' },
  { id: 'u2', name: 'Agent Jones' },
]

function mockGetResponses() {
  vi.mocked(apiClient.get).mockImplementation((url: string) => {
    if (url.startsWith('/api/tickets/')) return Promise.resolve({ data: { ticket: mockTicket } })
    if (url === '/api/users/agents') return Promise.resolve({ data: { agents: mockAgents } })
    return Promise.reject(new Error(`Unhandled GET ${url}`))
  })
}

describe('TicketDetailPage', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.patch).mockReset()
  })

  it('shows a skeleton while the request is pending', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}))
    const { container } = renderTicketDetailPage()

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(screen.queryByText('Cannot log in')).not.toBeInTheDocument()
  })

  it('shows an error message when the request fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('network error'))
    renderTicketDetailPage()

    expect(await screen.findByText('Failed to load ticket.')).toBeInTheDocument()
  })

  it('fetches the ticket by id from the URL', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { ticket: mockTicket } })
    renderTicketDetailPage('42')

    await screen.findByRole('heading', { name: 'Cannot log in' })
    expect(apiClient.get).toHaveBeenCalledWith('/api/tickets/42')
  })

  it('renders ticket details and the message thread', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { ticket: mockTicket } })
    renderTicketDetailPage()

    expect(await screen.findByRole('heading', { name: 'Cannot log in' })).toBeInTheDocument()
    expect(screen.getByText(TicketStatus.open)).toBeInTheDocument()
    expect(screen.getByText('technical question')).toBeInTheDocument()
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0)
    expect(screen.getByText(/jane@example\.com/)).toBeInTheDocument()
    expect(screen.getAllByText('Agent Smith').length).toBeGreaterThan(0)

    expect(screen.getByText("I can't log in to my account.")).toBeInTheDocument()
    expect(screen.getByText('Can you try resetting your password?')).toBeInTheDocument()

    expect(screen.getByText(new Date(mockTicket.updatedAt).toLocaleString())).toBeInTheDocument()
  })

  it('does not show message sender emails', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { ticket: mockTicket } })
    renderTicketDetailPage()

    await screen.findByRole('heading', { name: 'Cannot log in' })
    expect(screen.queryByText(/agent@example\.com/)).not.toBeInTheDocument()
    // jane@example.com is still shown once, as the requester's email in the meta row.
    expect(screen.getAllByText(/jane@example\.com/)).toHaveLength(1)
  })

  it('shows an unassigned fallback and no category badge when those fields are unset', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { ticket: { ...mockTicket, category: null, assignedTo: null, messages: [] } },
    })
    renderTicketDetailPage()

    await screen.findByRole('heading', { name: 'Cannot log in' })
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
    expect(screen.queryByText('technical question')).not.toBeInTheDocument()
    expect(screen.getByText('No messages yet.')).toBeInTheDocument()
  })

  it('shows the category as a badge next to the subject', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { ticket: mockTicket } })
    renderTicketDetailPage()

    const heading = await screen.findByRole('heading', { name: 'Cannot log in' })
    const badge = screen.getByText('technical question')
    expect(heading.parentElement).toContainElement(badge)
  })

  it('navigates back to the tickets list via the back link', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { ticket: mockTicket } })
    renderTicketDetailPage()

    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Cannot log in' })

    await user.click(screen.getByRole('link', { name: /back to tickets/i }))
    expect(await screen.findByText('Tickets list')).toBeInTheDocument()
  })

  it('shows the current assignee and lists agents to reassign to', async () => {
    mockGetResponses()
    renderTicketDetailPage()

    await screen.findByRole('heading', { name: 'Cannot log in' })
    const trigger = screen.getByRole('combobox', { name: 'Assigned To' })
    expect(trigger).toHaveTextContent('Agent Smith')

    const user = userEvent.setup()
    await user.click(trigger)

    expect(await screen.findByRole('option', { name: 'Agent Jones' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Unassigned' })).toBeInTheDocument()
  })

  it('reassigns the ticket when a different agent is selected', async () => {
    mockGetResponses()
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { ticket: { id: mockTicket.id, assignedTo: mockAgents[1] } },
    })
    renderTicketDetailPage()

    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Cannot log in' })

    await user.click(screen.getByRole('combobox', { name: 'Assigned To' }))
    await user.click(await screen.findByRole('option', { name: 'Agent Jones' }))

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith(`/api/tickets/${mockTicket.id}/assign`, {
        assignedToId: 'u2',
      }),
    )
  })

  it('unassigns the ticket when "Unassigned" is selected', async () => {
    mockGetResponses()
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { ticket: { id: mockTicket.id, assignedTo: null } },
    })
    renderTicketDetailPage()

    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Cannot log in' })

    await user.click(screen.getByRole('combobox', { name: 'Assigned To' }))
    await user.click(await screen.findByRole('option', { name: 'Unassigned' }))

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith(`/api/tickets/${mockTicket.id}/assign`, {
        assignedToId: null,
      }),
    )
  })
})
