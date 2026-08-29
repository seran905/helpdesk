import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { apiClient } from '@/lib/api-client'
import { renderCreateUserDialog } from '@/test/renderCreateUserDialog'

vi.mock('@/lib/api-client', () => ({
  apiClient: { post: vi.fn() },
}))

const mockCreatedUser = {
  id: '3',
  name: 'Agent Smith',
  email: 'agent@example.com',
  role: 'agent',
  createdAt: '2026-08-19T00:00:00.000Z',
}

async function openDialog() {
  const user = userEvent.setup()
  const { queryClient } = renderCreateUserDialog()
  await user.click(screen.getByRole('button', { name: 'Create user' }))
  return { user, queryClient }
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  { name = 'Agent Smith', email = 'agent@example.com', password = 'password123' } = {},
) {
  if (name) await user.type(screen.getByLabelText('Name'), name)
  if (email) await user.type(screen.getByLabelText('Email'), email)
  if (password) await user.type(screen.getByLabelText('Password'), password)
}

function getSubmitButton() {
  const buttons = screen.getAllByRole('button', { name: /Create user|Creating.../ })
  const submitButton = buttons.find((button) => button.getAttribute('type') === 'submit')
  if (!submitButton) throw new Error('Submit button not found')
  return submitButton
}

describe('CreateUserDialog', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
  })

  it('is closed by default and opens on trigger click', async () => {
    expect(screen.queryByRole('heading', { name: 'Create user' })).not.toBeInTheDocument()

    await openDialog()

    expect(await screen.findByRole('heading', { name: 'Create user' })).toBeInTheDocument()
  })

  it('shows a validation error and does not submit when the name is too short', async () => {
    const { user } = await openDialog()

    await fillForm(user, { name: 'ab' })
    await user.click(getSubmitButton())

    expect(
      await screen.findByText('Name must be at least 3 characters'),
    ).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('shows a validation error and does not submit when the password is too short', async () => {
    const { user } = await openDialog()

    await fillForm(user, { password: 'short1' })
    await user.click(getSubmitButton())

    expect(
      await screen.findByText('Password must be at least 8 characters'),
    ).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('shows a validation error and does not submit when the email is invalid', async () => {
    const { user } = await openDialog()

    await fillForm(user, { email: 'not-an-email' })
    await user.click(getSubmitButton())

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('shows a validation error for every field when submitted empty', async () => {
    const { user } = await openDialog()

    await user.click(getSubmitButton())

    expect(
      await screen.findByText('Name must be at least 3 characters'),
    ).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('disables the submit button and shows a pending label while submitting', async () => {
    let resolvePost!: (value: unknown) => void
    vi.mocked(apiClient.post).mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve
      }),
    )
    const { user } = await openDialog()

    await fillForm(user)
    await user.click(getSubmitButton())

    const pendingButton = await screen.findByRole('button', { name: 'Creating...' })
    expect(pendingButton).toBeDisabled()

    resolvePost({ data: { user: mockCreatedUser } })

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Create user' })).not.toBeInTheDocument(),
    )
  })

  it('submits the form and closes the dialog on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { user: mockCreatedUser } })
    const { user } = await openDialog()

    await fillForm(user)
    await user.click(getSubmitButton())

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith('/api/users', {
        name: 'Agent Smith',
        email: 'agent@example.com',
        password: 'password123',
      }),
    )
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Create user' })).not.toBeInTheDocument(),
    )
  })

  it('invalidates the users query cache on successful submission', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { user: mockCreatedUser } })
    const { user, queryClient } = await openDialog()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await fillForm(user)
    await user.click(getSubmitButton())

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] }),
    )
  })

  it('clears the form fields after a successful submission and reopening', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { user: mockCreatedUser } })
    const { user } = await openDialog()

    await fillForm(user)
    await user.click(getSubmitButton())

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Create user' })).not.toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: 'Create user' }))

    expect(await screen.findByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  it('shows the server error and keeps the dialog open when the email is already taken', async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'A user with this email already exists' } },
    })
    const { user } = await openDialog()

    await fillForm(user)
    await user.click(getSubmitButton())

    expect(
      await screen.findByText('A user with this email already exists'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create user' })).toBeInTheDocument()
  })
})
