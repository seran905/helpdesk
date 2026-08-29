import { Role } from 'core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { apiClient } from '@/lib/api-client'
import { renderDeleteUserDialog } from '@/test/renderDeleteUserDialog'
import type { User } from '@/components/UsersTable'

vi.mock('@/lib/api-client', () => ({
  apiClient: { delete: vi.fn() },
}))

const mockUser: User = {
  id: '2',
  name: 'Test Agent',
  email: 'agent@example.com',
  role: Role.agent,
  createdAt: '2026-08-10T00:00:00.000Z',
}

async function openDialog() {
  const user = userEvent.setup()
  const { queryClient } = renderDeleteUserDialog(mockUser)
  await user.click(screen.getByRole('button', { name: `Delete ${mockUser.name}` }))
  return { user, queryClient }
}

function getConfirmButton() {
  return screen.getByRole('button', { name: /^(Delete|Deleting\.\.\.)$/ })
}

describe('DeleteUserDialog', () => {
  beforeEach(() => {
    vi.mocked(apiClient.delete).mockReset()
  })

  it("is closed by default and opens with a confirmation message naming the user on trigger click", async () => {
    expect(screen.queryByRole('heading', { name: 'Delete user' })).not.toBeInTheDocument()

    await openDialog()

    expect(await screen.findByRole('heading', { name: 'Delete user' })).toBeInTheDocument()
    expect(screen.getByText(/Test Agent/)).toBeInTheDocument()
    expect(apiClient.delete).not.toHaveBeenCalled()
  })

  it('closes without deleting when Cancel is clicked', async () => {
    const { user } = await openDialog()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Delete user' })).not.toBeInTheDocument(),
    )
    expect(apiClient.delete).not.toHaveBeenCalled()
  })

  it('closes without deleting when clicking outside the dialog', async () => {
    const { user } = await openDialog()

    const overlay = document.querySelector('[data-slot="dialog-overlay"]')
    expect(overlay).not.toBeNull()
    await user.click(overlay as Element)

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Delete user' })).not.toBeInTheDocument(),
    )
    expect(apiClient.delete).not.toHaveBeenCalled()
  })

  it('closes without deleting when pressing Escape', async () => {
    const { user } = await openDialog()

    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Delete user' })).not.toBeInTheDocument(),
    )
    expect(apiClient.delete).not.toHaveBeenCalled()
  })

  it('calls the delete endpoint and closes the dialog when confirmed', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} })
    const { user } = await openDialog()

    await user.click(getConfirmButton())

    await waitFor(() =>
      expect(apiClient.delete).toHaveBeenCalledWith(`/api/users/${mockUser.id}`),
    )
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Delete user' })).not.toBeInTheDocument(),
    )
  })

  it('invalidates the users query cache on successful deletion', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} })
    const { user, queryClient } = await openDialog()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(getConfirmButton())

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] }))
  })

  it('shows the server error and keeps the dialog open when deletion is forbidden', async () => {
    vi.mocked(apiClient.delete).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Admin accounts cannot be deleted' } },
    })
    const { user } = await openDialog()

    await user.click(getConfirmButton())

    expect(await screen.findByText('Admin accounts cannot be deleted')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Delete user' })).toBeInTheDocument()
  })

  it('clears a previous error when reopened', async () => {
    vi.mocked(apiClient.delete).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Admin accounts cannot be deleted' } },
    })
    const { user } = await openDialog()
    await user.click(getConfirmButton())
    expect(await screen.findByText('Admin accounts cannot be deleted')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Delete user' })).not.toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: `Delete ${mockUser.name}` }))

    expect(await screen.findByRole('heading', { name: 'Delete user' })).toBeInTheDocument()
    expect(screen.queryByText('Admin accounts cannot be deleted')).not.toBeInTheDocument()
  })
})
