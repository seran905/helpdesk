import { useQuery } from '@tanstack/react-query'
import { useSession } from '../lib/auth-client'
import { apiClient } from '../lib/api-client'
import { Skeleton } from '@/components/ui/skeleton'

type ApiStatus = 'ok' | 'error'

function HomePage() {
  const { data: session } = useSession()
  const { data: health, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get('/api/health').then((res) => res.data),
  })

  const status: ApiStatus = !isPending && !isError && health.status === 'ok' ? 'ok' : 'error'

  const statusLabel = {
    ok: 'All systems operational',
    error: 'Failed to reach the API',
  }[status]

  const statusColors = {
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
        {isPending ? (
          <Skeleton className="mx-auto h-[30px] w-44 rounded-full" />
        ) : (
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${statusColors}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusLabel}
          </span>
        )}
      </div>
    </div>
  )
}

export default HomePage
