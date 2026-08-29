import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DeleteUserDialog from '@/components/DeleteUserDialog'
import type { User } from '@/components/UsersTable'

export function renderDeleteUserDialog(user: User) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <DeleteUserDialog user={user} />
      </QueryClientProvider>,
    ),
  }
}
