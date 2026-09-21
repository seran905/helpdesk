import { SenderType, TicketCategory, TicketStatus } from 'core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { apiClient } from '@/lib/api-client'
import { formatDateTime } from '@/lib/formatDate'
import { renderTicketDetailPage } from '@/test/renderTicketDetailPage'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
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
      senderType: SenderType.customer,
      body: "I can't log in to my account.",
      createdAt: '2026-08-29T00:00:00.000Z',
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
    vi.mocked(apiClient.post).mockReset()
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

    expect(screen.getByText(`Updated ${formatDateTime(mockTicket.updatedAt)}`)).toBeInTheDocument()
  })

  it('badges agent replies but not customer messages', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { ticket: mockTicket } })
    renderTicketDetailPage()

    await screen.findByRole('heading', { name: 'Cannot log in' })

    const customerMessage = screen.getByText("I can't log in to my account.").closest('div')
    const agentMessage = screen.getByText('Can you try resetting your password?').closest('div')

    expect(customerMessage).not.toHaveTextContent('Agent')
    expect(agentMessage).toHaveTextContent('Agent')
  })

  it('does not show message sender emails', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { ticket: mockTicket } })
    renderTicketDetailPage()

    await screen.findByRole('heading', { name: 'Cannot log in' })
    expect(screen.queryByText(/agent@example\.com/)).not.toBeInTheDocument()
    // jane@example.com is still shown once, as the requester's email in the meta row.
    expect(screen.getAllByText(/jane@example\.com/)).toHaveLength(1)
  })

  it('shows unassigned/uncategorized fallbacks when those fields are unset', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { ticket: { ...mockTicket, category: null, assignedTo: null, messages: [] } },
    })
    renderTicketDetailPage()

    await screen.findByRole('heading', { name: 'Cannot log in' })
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
    expect(screen.queryByText('technical question')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('uncategorized')
    expect(screen.getByText('No messages yet.')).toBeInTheDocument()
  })

  it('groups the status, category, and assignee dropdowns together', async () => {
    mockGetResponses()
    renderTicketDetailPage()

    await screen.findByRole('heading', { name: 'Cannot log in' })
    const statusSelect = screen.getByRole('combobox', { name: 'Status' })
    const categorySelect = screen.getByRole('combobox', { name: 'Category' })
    const assigneeSelect = screen.getByRole('combobox', { name: 'Assigned To' })

    // All three dropdowns live together in the same case panel.
    const column = statusSelect.closest('[data-slot="case-panel"]')
    expect(column).toContainElement(categorySelect)
    expect(column).toContainElement(assigneeSelect)
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

  it('updates the status when a different option is selected', async () => {
    mockGetResponses()
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { ticket: { id: mockTicket.id, status: TicketStatus.resolved } },
    })
    renderTicketDetailPage()

    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Cannot log in' })

    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: TicketStatus.resolved }))

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith(`/api/tickets/${mockTicket.id}/status`, {
        status: TicketStatus.resolved,
      }),
    )
  })

  it('updates the category when a different option is selected', async () => {
    mockGetResponses()
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { ticket: { id: mockTicket.id, category: TicketCategory.refund_request } },
    })
    renderTicketDetailPage()

    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Cannot log in' })

    await user.click(screen.getByRole('combobox', { name: 'Category' }))
    await user.click(await screen.findByRole('option', { name: 'refund request' }))

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith(`/api/tickets/${mockTicket.id}/category`, {
        category: TicketCategory.refund_request,
      }),
    )
  })

  it('clears the category when "uncategorized" is selected', async () => {
    mockGetResponses()
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { ticket: { id: mockTicket.id, category: null } },
    })
    renderTicketDetailPage()

    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Cannot log in' })

    await user.click(screen.getByRole('combobox', { name: 'Category' }))
    await user.click(await screen.findByRole('option', { name: 'uncategorized' }))

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith(`/api/tickets/${mockTicket.id}/category`, {
        category: null,
      }),
    )
  })

  it('submits a reply', async () => {
    mockGetResponses()
    vi.mocked(apiClient.post).mockResolvedValue({ data: { message: {} } })
    renderTicketDetailPage()

    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Cannot log in' })

    await user.type(screen.getByLabelText('Reply'), 'Thanks for reaching out.')
    await user.click(screen.getByRole('button', { name: 'Send reply' }))

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(`/api/tickets/${mockTicket.id}/replies`, {
        body: 'Thanks for reaching out.',
      }),
    )
  })

  it('disables the send reply button when the reply is empty', async () => {
    mockGetResponses()
    renderTicketDetailPage()

    await screen.findByRole('heading', { name: 'Cannot log in' })

    expect(screen.getByRole('button', { name: 'Send reply' })).toBeDisabled()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('shows an error and keeps the draft when the reply fails to send', async () => {
    mockGetResponses()
    vi.mocked(apiClient.post).mockRejectedValue(new Error('network error'))
    renderTicketDetailPage()

    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Cannot log in' })

    const textarea = screen.getByLabelText('Reply')
    await user.type(textarea, 'Thanks for reaching out.')
    await user.click(screen.getByRole('button', { name: 'Send reply' }))

    expect(await screen.findByText('Failed to send reply')).toBeInTheDocument()
    expect(textarea).toHaveValue('Thanks for reaching out.')
  })

  it('disables the polish button when the reply is empty', async () => {
    mockGetResponses()
    renderTicketDetailPage()

    await screen.findByRole('heading', { name: 'Cannot log in' })
    expect(screen.getByRole('button', { name: 'Polish' })).toBeDisabled()
  })

  it('enables the polish button once a draft is typed', async () => {
    mockGetResponses()
    renderTicketDetailPage()

    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Cannot log in' })

    await user.type(screen.getByLabelText('Reply'), 'hey checking in')
    expect(screen.getByRole('button', { name: 'Polish' })).toBeEnabled()
  })

  it('polishes the draft and replaces the textarea with the result', async () => {
    mockGetResponses()
    const polished = "Dear Jane,\n\nJust checking in on this.\n\nRegards,\nAgent Smith"
    vi.mocked(apiClient.post).mockResolvedValue({ data: { body: polished } })
    renderTicketDetailPage()

    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Cannot log in' })

    const textarea = screen.getByLabelText('Reply')
    await user.type(textarea, 'hey checking in')
    await user.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(`/api/tickets/${mockTicket.id}/replies/polish`, {
        body: 'hey checking in',
      }),
    )
    await waitFor(() => expect(textarea).toHaveValue(polished))
  })

  it('shows an error and keeps the draft when polishing fails', async () => {
    mockGetResponses()
    vi.mocked(apiClient.post).mockRejectedValue(new Error('network error'))
    renderTicketDetailPage()

    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'Cannot log in' })

    const textarea = screen.getByLabelText('Reply')
    await user.type(textarea, 'hey checking in')
    await user.click(screen.getByRole('button', { name: 'Polish' }))

    expect(await screen.findByText('Failed to polish reply')).toBeInTheDocument()
    expect(textarea).toHaveValue('hey checking in')
    expect(apiClient.post).not.toHaveBeenCalledWith(
      `/api/tickets/${mockTicket.id}/replies`,
      expect.anything(),
    )
  })
})
