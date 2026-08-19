import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { apiClient } from '@/lib/api-client'
import { renderCreateUserDialog } from '@/test/renderCreateUserDialog'

vi.mock('@/lib/api-client', () => ({
  apiClient: { post: vi.fn() },
}))

async function openDialog() {
  const user = userEvent.setup()
  renderCreateUserDialog()
  await user.click(screen.getByRole('button', { name: 'Create user' }))
  return user
}

function getSubmitButton() {
  const buttons = screen.getAllByRole('button', { name: 'Create user' })
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
    const user = await openDialog()

    await user.type(screen.getByLabelText('Name'), 'ab')
    await user.type(screen.getByLabelText('Email'), 'agent@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(getSubmitButton())

    expect(
      await screen.findByText('Name must be at least 3 characters'),
    ).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('shows a validation error and does not submit when the password is too short', async () => {
    const user = await openDialog()

    await user.type(screen.getByLabelText('Name'), 'Agent Smith')
    await user.type(screen.getByLabelText('Email'), 'agent@example.com')
    await user.type(screen.getByLabelText('Password'), 'short1')
    await user.click(getSubmitButton())

    expect(
      await screen.findByText('Password must be at least 8 characters'),
    ).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('shows a validation error and does not submit when the email is invalid', async () => {
    const user = await openDialog()

    await user.type(screen.getByLabelText('Name'), 'Agent Smith')
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(getSubmitButton())

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('submits the form and closes the dialog on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        user: {
          id: '3',
          name: 'Agent Smith',
          email: 'agent@example.com',
          role: 'agent',
          createdAt: '2026-08-19T00:00:00.000Z',
        },
      },
    })
    const user = await openDialog()

    await user.type(screen.getByLabelText('Name'), 'Agent Smith')
    await user.type(screen.getByLabelText('Email'), 'agent@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
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

  it('shows the server error and keeps the dialog open when the email is already taken', async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'A user with this email already exists' } },
    })
    const user = await openDialog()

    await user.type(screen.getByLabelText('Name'), 'Agent Smith')
    await user.type(screen.getByLabelText('Email'), 'agent@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(getSubmitButton())

    expect(
      await screen.findByText('A user with this email already exists'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Create user' })).toBeInTheDocument()
  })
})
