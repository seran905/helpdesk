import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TicketsPage from '@/pages/TicketsPage'

export function renderTicketsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TicketsPage />
    </QueryClientProvider>,
  )
}
