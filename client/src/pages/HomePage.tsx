import { useQuery } from '@tanstack/react-query'
import { Bot, Clock, Percent, Ticket, TicketCheck } from 'lucide-react'
import { useSession } from '../lib/auth-client'
import { apiClient } from '../lib/api-client'
import StatCard from '@/components/StatCard'
import TicketsPerDayChart from '@/components/TicketsPerDayChart'

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

  const {
    data: stats,
    isPending: isStatsPending,
    isError: isStatsError,
  } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: () => apiClient.get('/api/tickets/stats').then((res) => res.data as TicketStats),
  })

  return (
    <div className="flex flex-grow flex-col items-center px-6 py-16">
      <h1 className="text-[32px] font-semibold tracking-tight text-foreground">
        Welcome, <span className="text-primary">{session?.user.name}</span>
      </h1>

      <div className="mt-8 w-full max-w-5xl">
        {isStatsError ? (
          <p className="text-center text-sm text-destructive">Failed to load dashboard stats.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="Total Tickets"
              value={stats?.totalTickets.toLocaleString() ?? ''}
              icon={Ticket}
              isPending={isStatsPending}
            />
            <StatCard
              label="Open Tickets"
              value={stats?.openTickets.toLocaleString() ?? ''}
              icon={TicketCheck}
              isPending={isStatsPending}
            />
            <StatCard
              label="AI-Resolved Tickets"
              value={stats?.aiResolvedTickets.toLocaleString() ?? ''}
              icon={Bot}
              isPending={isStatsPending}
            />
            <StatCard
              label="AI Resolution Rate"
              value={stats ? `${stats.aiResolvedPercentage.toFixed(0)}%` : ''}
              icon={Percent}
              isPending={isStatsPending}
            />
            <StatCard
              label="Average Resolution Time"
              value={stats ? formatDuration(stats.averageResolutionTimeMs) : ''}
              icon={Clock}
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
