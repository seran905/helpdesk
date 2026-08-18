import { useQuery } from '@tanstack/react-query'
import { useSession } from '../lib/auth-client'
import { apiClient } from '../lib/api-client'

type ApiStatus = 'pending' | 'ok' | 'error'

function HomePage() {
  const { data: session } = useSession()
  const { data: health, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get('/api/health').then((res) => res.data),
  })

  let status: ApiStatus = 'ok'
  if (isPending) status = 'pending'
  else if (isError || health.status !== 'ok') status = 'error'

  const statusLabel = {
    pending: 'Checking API status...',
    ok: 'All systems operational',
    error: 'Failed to reach the API',
  }[status]

  const statusColors = {
    pending: 'border-primary/25 bg-primary/10 text-primary',
    ok: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    error: 'border-destructive/25 bg-destructive/10 text-destructive',
  }[status]

  return (
    <div className="flex flex-grow flex-col items-center px-6 py-24">
      <div className="max-w-[480px] text-center">
        <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
          Welcome, {session?.user.name}
        </h1>
        <p className="mt-2.5 mb-6 text-[15px] text-muted-foreground">
          Here's what's happening with your helpdesk today.
        </p>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${statusColors}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
      </div>
    </div>
  )
}

export default HomePage
