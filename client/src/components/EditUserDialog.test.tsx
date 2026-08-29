import { Role } from 'core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { apiClient } from '@/lib/api-client'
import { renderEditUserDialog } from '@/test/renderEditUserDialog'
import type { User } from '@/components/UsersTable'

vi.mock('@/lib/api-client', () => ({
  apiClient: { patch: vi.fn() },
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
  const { queryClient } = renderEditUserDialog(mockUser)
  await user.click(screen.getByRole('button', { name: `Edit ${mockUser.name}` }))
  return { user, queryClient }
}

function getSubmitButton() {
  return screen.getByRole('button', { name: /Save changes|Saving.../ })
}

describe('EditUserDialog', () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockReset()
  })

  it("is closed by default and opens pre-populated with the user's data on trigger click", async () => {
    expect(screen.queryByRole('heading', { name: 'Edit user' })).not.toBeInTheDocument()

    await openDialog()

    expect(await screen.findByRole('heading', { name: 'Edit user' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue(mockUser.name)
    expect(screen.getByLabelText('Email')).toHaveValue(mockUser.email)
    expect(screen.getByLabelText('New password')).toHaveValue('')
  })

  it('shows a validation error and does not submit when the name is too short', async () => {
    const { user } = await openDialog()

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'ab')
    await user.click(getSubmitButton())

    expect(await screen.findByText('Name must be at least 3 characters')).toBeInTheDocument()
    expect(apiClient.patch).not.toHaveBeenCalled()
  })

  it('shows a validation error and does not submit when the email is invalid', async () => {
    const { user } = await openDialog()

    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.click(getSubmitButton())

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(apiClient.patch).not.toHaveBeenCalled()
  })

  it('shows a validation error and does not submit when a new password is too short', async () => {
    const { user } = await openDialog()

    await user.type(screen.getByLabelText('New password'), 'short1')
    await user.click(getSubmitButton())

    expect(
      await screen.findByText('Password must be at least 8 characters'),
    ).toBeInTheDocument()
    expect(apiClient.patch).not.toHaveBeenCalled()
  })

  it('submits with an empty password to leave it unchanged', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { user: { ...mockUser, name: 'Updated Name' } },
    })
    const { user } = await openDialog()

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Updated Name')
    await user.click(getSubmitButton())

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith(`/api/users/${mockUser.id}`, {
        name: 'Updated Name',
        email: mockUser.email,
        password: '',
      }),
    )
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Edit user' })).not.toBeInTheDocument(),
    )
  })

  it('submits the new password when one is provided', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { user: mockUser } })
    const { user } = await openDialog()

    await user.type(screen.getByLabelText('New password'), 'newpassword1')
    await user.click(getSubmitButton())

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith(`/api/users/${mockUser.id}`, {
        name: mockUser.name,
        email: mockUser.email,
        password: 'newpassword1',
      }),
    )
  })

  it('invalidates the users query cache on successful submission', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { user: mockUser } })
    const { user, queryClient } = await openDialog()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(getSubmitButton())

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] }))
  })

  it('shows the server error and keeps the dialog open when the email is already taken', async () => {
    vi.mocked(apiClient.patch).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'A user with this email already exists' } },
    })
    const { user } = await openDialog()

    await user.click(getSubmitButton())

    expect(
      await screen.findByText('A user with this email already exists'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Edit user' })).toBeInTheDocument()
  })

  it('resets to the original values when reopened after canceling', async () => {
    const { user } = await openDialog()

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Something Else')

    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Edit user' })).not.toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: `Edit ${mockUser.name}` }))

    expect(await screen.findByLabelText('Name')).toHaveValue(mockUser.name)
  })
})
