import { useQuery } from '@tanstack/react-query'
import { useSession } from '../lib/auth-client'
import { apiClient } from '../lib/api-client'
import { Skeleton } from '@/components/ui/skeleton'
import StatCard from '@/components/StatCard'
import TicketsPerDayChart from '@/components/TicketsPerDayChart'

type ApiStatus = 'ok' | 'error'

type TicketStats = {
  totalTickets: number
  openTickets: number
  aiResolvedTickets: number
  aiResolvedPercentage: number
  averageResolutionTimeMs: number | null
  dailyTicketCounts: { date: string; count: number }[]
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—'

  const minutes = Math.round(ms / (60 * 1000))
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours < 24) return `${hours}h ${remainingMinutes}m`

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return `${days}d ${remainingHours}h`
}

function HomePage() {
  const { data: session } = useSession()
  const { data: health, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get('/api/health').then((res) => res.data),
  })

  const {
    data: stats,
    isPending: isStatsPending,
    isError: isStatsError,
  } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: () => apiClient.get('/api/tickets/stats').then((res) => res.data as TicketStats),
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
    <div className="flex flex-grow flex-col items-center px-6 py-16">
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

      <div className="mt-12 w-full max-w-5xl">
        {isStatsError ? (
          <p className="text-center text-sm text-destructive">Failed to load dashboard stats.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="Total tickets"
              value={stats?.totalTickets.toLocaleString() ?? ''}
              isPending={isStatsPending}
            />
            <StatCard
              label="Open tickets"
              value={stats?.openTickets.toLocaleString() ?? ''}
              isPending={isStatsPending}
            />
            <StatCard
              label="Resolved by AI"
              value={stats?.aiResolvedTickets.toLocaleString() ?? ''}
              isPending={isStatsPending}
            />
            <StatCard
              label="% resolved by AI"
              value={stats ? `${stats.aiResolvedPercentage.toFixed(0)}%` : ''}
              isPending={isStatsPending}
            />
            <StatCard
              label="Avg. resolution time"
              value={stats ? formatDuration(stats.averageResolutionTimeMs) : ''}
              isPending={isStatsPending}
            />
          </div>
        )}

        {!isStatsError && (
          <div className="mt-6">
            <TicketsPerDayChart
              dailyCounts={stats?.dailyTicketCounts}
              isPending={isStatsPending}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
