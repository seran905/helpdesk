import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EditUserDialog from '@/components/EditUserDialog'
import type { User } from '@/components/UsersTable'

export function renderEditUserDialog(user: User) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <EditUserDialog user={user} />
      </QueryClientProvider>,
    ),
  }
}
