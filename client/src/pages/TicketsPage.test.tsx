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

const defaultParams = { sortBy: 'createdAt', sortOrder: 'desc', pageIndex: 0, pageSize: 10 }

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
    vi.mocked(apiClient.get).mockResolvedValue({ data: { tickets: [], total: 0 } })
    renderTicketsPage()

    expect(await screen.findByText('No tickets found.')).toBeInTheDocument()
  })

  it('renders each ticket with subject, requester, status, category, assignee, and created date', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { tickets: mockTickets, total: mockTickets.length },
    })
    renderTicketsPage()

    expect(await screen.findByText('Cannot log in')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText(TicketStatus.open)).toBeInTheDocument()
    expect(screen.getByText('Technical')).toBeInTheDocument()
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
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { tickets: mockTickets, total: mockTickets.length },
    })
    renderTicketsPage()

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', { params: defaultParams }),
    )
  })

  it('refetches with the clicked column when a sortable header is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { tickets: mockTickets, total: mockTickets.length },
    })
    renderTicketsPage()

    const user = userEvent.setup()
    await screen.findByText('Cannot log in')

    await user.click(screen.getByRole('button', { name: /subject/i }))

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', {
        params: { ...defaultParams, sortBy: 'subject', sortOrder: 'asc' },
      }),
    )

    await user.click(screen.getByRole('button', { name: /subject/i }))

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', {
        params: { ...defaultParams, sortBy: 'subject', sortOrder: 'desc' },
      }),
    )
  })

  it('refetches with a debounced search param when typing in the search box', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { tickets: mockTickets, total: mockTickets.length },
    })
    renderTicketsPage()

    const user = userEvent.setup()
    await screen.findByText('Cannot log in')

    await user.type(screen.getByPlaceholderText('Search subject or requester...'), 'refund')

    await waitFor(
      () =>
        expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', {
          params: { ...defaultParams, search: 'refund' },
        }),
      { timeout: 2000 },
    )
  })

  it('refetches with a status param when a status filter is selected', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { tickets: mockTickets, total: mockTickets.length },
    })
    renderTicketsPage()

    const user = userEvent.setup()
    await screen.findByText('Cannot log in')

    await user.click(screen.getByRole('combobox', { name: 'Filter by status' }))
    await user.click(await screen.findByRole('option', { name: 'Resolved' }))

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', {
        params: { ...defaultParams, status: 'resolved' },
      }),
    )
  })

  it('refetches with a category param when the uncategorized filter is selected', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { tickets: mockTickets, total: mockTickets.length },
    })
    renderTicketsPage()

    const user = userEvent.setup()
    await screen.findByText('Cannot log in')

    await user.click(screen.getByRole('combobox', { name: 'Filter by category' }))
    await user.click(await screen.findByRole('option', { name: 'Uncategorized' }))

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', {
        params: { ...defaultParams, category: 'uncategorized' },
      }),
    )
  })

  it('shows the page count and disables Previous on the first page', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { tickets: mockTickets, total: 25 } })
    renderTicketsPage()

    expect(await screen.findByText('of 3')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Jump to position' })).toHaveValue('1')
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('refetches with the next pageIndex when Next is clicked, and disables Next on the last page', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { tickets: mockTickets, total: 25 } })
    renderTicketsPage()

    const user = userEvent.setup()
    await screen.findByText('of 3')

    await user.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', {
        params: { ...defaultParams, pageIndex: 1 },
      }),
    )
    expect(await screen.findByRole('textbox', { name: 'Jump to position' })).toHaveValue('2')

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('textbox', { name: 'Jump to position' })).toHaveValue('3')
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('jumps to the typed page number when the page input is submitted', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { tickets: mockTickets, total: 25 } })
    renderTicketsPage()

    const user = userEvent.setup()
    await screen.findByText('of 3')

    const pageInput = screen.getByRole('textbox', { name: 'Jump to position' })
    await user.clear(pageInput)
    await user.type(pageInput, '3{Enter}')

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', {
        params: { ...defaultParams, pageIndex: 2 },
      }),
    )
    expect(pageInput).toHaveValue('3')
  })

  it('reverts the page input to the current page when given an out-of-range value', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { tickets: mockTickets, total: 25 } })
    renderTicketsPage()

    const user = userEvent.setup()
    await screen.findByText('of 3')

    const pageInput = screen.getByRole('textbox', { name: 'Jump to position' })
    await user.clear(pageInput)
    await user.type(pageInput, '9{Enter}')

    expect(pageInput).toHaveValue('1')
    expect(apiClient.get).not.toHaveBeenCalledWith('/api/tickets', {
      params: { ...defaultParams, pageIndex: 8 },
    })
  })

  it('resets to the first page when a filter changes', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { tickets: mockTickets, total: 25 } })
    renderTicketsPage()

    const user = userEvent.setup()
    await screen.findByText('of 3')

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('textbox', { name: 'Jump to position' })).toHaveValue('2')

    await user.click(screen.getByRole('combobox', { name: 'Filter by status' }))
    await user.click(await screen.findByRole('option', { name: 'Resolved' }))

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', {
        params: { ...defaultParams, status: 'resolved', pageIndex: 0 },
      }),
    )
  })

  it('shows the current page size and offers 10/20/30 options', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { tickets: mockTickets, total: 25 } })
    renderTicketsPage()

    const user = userEvent.setup()
    await screen.findByText('of 3')

    expect(screen.getByRole('combobox', { name: 'Rows shown' })).toHaveTextContent('10 rows')

    await user.click(screen.getByRole('combobox', { name: 'Rows shown' }))
    expect(await screen.findByRole('option', { name: '10 rows' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '20 rows' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '30 rows' })).toBeInTheDocument()
  })

  it('refetches with the new pageSize and resets to the first page when it changes', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { tickets: mockTickets, total: 25 } })
    renderTicketsPage()

    const user = userEvent.setup()
    await screen.findByText('of 3')

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('textbox', { name: 'Jump to position' })).toHaveValue('2')

    await user.click(screen.getByRole('combobox', { name: 'Rows shown' }))
    await user.click(await screen.findByRole('option', { name: '30 rows' }))

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/tickets', {
        params: { ...defaultParams, pageSize: 30, pageIndex: 0 },
      }),
    )
  })
})
