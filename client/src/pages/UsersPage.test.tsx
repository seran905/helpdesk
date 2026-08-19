import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { apiClient } from '@/lib/api-client'
import { renderUsersPage } from '@/test/renderUsersPage'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

const mockUsers = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: '2026-08-09T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Test Agent',
    email: 'agent@example.com',
    role: 'agent',
    createdAt: '2026-08-10T00:00:00.000Z',
  },
]

describe('UsersPage', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
  })

  it('shows a skeleton table while the request is pending', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}))
    const { container } = renderUsersPage()

    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument()
  })

  it('shows an error message when the request fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('network error'))
    renderUsersPage()

    expect(await screen.findByText('Failed to load users.')).toBeInTheDocument()
  })

  it('shows an empty state when there are no users', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { users: [] } })
    renderUsersPage()

    expect(await screen.findByText('No users found.')).toBeInTheDocument()
  })

  it('renders each user with their name, email, role, and joined date', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { users: mockUsers } })
    renderUsersPage()

    expect(await screen.findByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(
      screen.getByText(new Date(mockUsers[0].createdAt).toLocaleDateString()),
    ).toBeInTheDocument()

    expect(screen.getByText('Test Agent')).toBeInTheDocument()
    expect(screen.getByText('agent@example.com')).toBeInTheDocument()
    expect(screen.getByText('agent')).toBeInTheDocument()
    expect(
      screen.getByText(new Date(mockUsers[1].createdAt).toLocaleDateString()),
    ).toBeInTheDocument()
  })

  it('fetches from /api/users', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { users: mockUsers } })
    renderUsersPage()

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/users'))
  })

  it('shows a "Create user" button above the user list', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { users: mockUsers } })
    renderUsersPage()

    expect(await screen.findByRole('button', { name: 'Create user' })).toBeInTheDocument()
  })
})
