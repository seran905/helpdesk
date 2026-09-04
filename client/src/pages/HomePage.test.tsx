import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { apiClient } from '@/lib/api-client'
import { useSession } from '../lib/auth-client'
import { renderHomePage } from '@/test/renderHomePage'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('../lib/auth-client', () => ({
  useSession: vi.fn(),
}))

function buildMockDailyCounts(): { date: string; count: number }[] {
  const counts = []
  const start = new Date(Date.UTC(2026, 7, 6))
  for (let i = 0; i < 30; i++) {
    const date = new Date(start)
    date.setUTCDate(date.getUTCDate() + i)
    counts.push({ date: date.toISOString().slice(0, 10), count: i % 5 })
  }
  return counts
}

const mockStats = {
  totalTickets: 42,
  openTickets: 7,
  aiResolvedTickets: 15,
  aiResolvedPercentage: 35.7,
  averageResolutionTimeMs: 2 * 60 * 60 * 1000 + 15 * 60 * 1000,
  dailyTicketCounts: buildMockDailyCounts(),
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test User' } },
    } as ReturnType<typeof useSession>)
  })

  it('shows skeletons while stats are pending', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}))
    const { container } = renderHomePage()

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  it('shows an error message when the stats request fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('network error'))
    renderHomePage()

    expect(await screen.findByText('Failed to load dashboard stats.')).toBeInTheDocument()
  })

  it('renders the total, open, AI-resolved, AI-resolved %, and average resolution time stats', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockStats })
    renderHomePage()

    expect(screen.getByText('Total tickets')).toBeInTheDocument()
    expect(await screen.findByText('42')).toBeInTheDocument()

    expect(screen.getByText('Open tickets')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()

    expect(screen.getByText('Resolved by AI')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()

    expect(screen.getByText('% resolved by AI')).toBeInTheDocument()
    expect(screen.getByText('36%')).toBeInTheDocument()

    expect(screen.getByText('Avg. resolution time')).toBeInTheDocument()
    expect(screen.getByText('2h 15m')).toBeInTheDocument()
  })

  it('shows a placeholder average resolution time when there are no resolved tickets yet', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { ...mockStats, averageResolutionTimeMs: null },
    })
    renderHomePage()

    expect(await screen.findByText('—')).toBeInTheDocument()
  })

  it('renders a bar chart of tickets per day for the past 30 days', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockStats })
    renderHomePage()

    expect(screen.getByText('Tickets per day (last 30 days)')).toBeInTheDocument()
    expect(await screen.findByLabelText('Sep 4: 4 tickets')).toBeInTheDocument()
    expect(screen.getByLabelText('Aug 6: 0 tickets')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(30)
  })
})
