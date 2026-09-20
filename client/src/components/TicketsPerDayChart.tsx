import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type DailyTicketCount = {
  date: string
  count: number
}

type TicketsPerDayChartProps = {
  dailyCounts?: DailyTicketCount[]
  isPending?: boolean
}

const CHART_HEIGHT = 160
const MIN_BAR_HEIGHT = 2
const X_LABEL_INTERVAL = 5

function niceCeil(value: number): number {
  if (value <= 0) return 1
  const exponent = Math.floor(Math.log10(value))
  const magnitude = 10 ** exponent
  const residual = value / magnitude
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10
  return niceResidual * magnitude
}

function formatDayLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function TicketsPerDayChart({ dailyCounts, isPending }: TicketsPerDayChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Tickets per day (last 30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending || !dailyCounts ? (
          <Skeleton style={{ height: CHART_HEIGHT + 32 }} className="w-full" />
        ) : (
          <TicketsPerDayBars dailyCounts={dailyCounts} />
        )}
      </CardContent>
    </Card>
  )
}

function TicketsPerDayBars({ dailyCounts }: { dailyCounts: DailyTicketCount[] }) {
  const maxCount = Math.max(...dailyCounts.map((d) => d.count), 0)
  const yMax = niceCeil(maxCount)
  const yTicks = [yMax, Math.round(yMax / 2), 0]

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
      <div
        className="flex flex-col justify-between text-xs tabular-nums text-muted-foreground"
        style={{ height: CHART_HEIGHT }}
      >
        {yTicks.map((tick) => (
          <span key={tick}>{tick.toLocaleString()}</span>
        ))}
      </div>

      <div className="relative" style={{ height: CHART_HEIGHT }}>
        <div className="absolute inset-0 flex flex-col justify-between" aria-hidden="true">
          {yTicks.map((tick) => (
            <div key={tick} className="border-t border-border" />
          ))}
        </div>

        <div className="relative flex h-full items-end">
          {dailyCounts.map(({ date, count }) => {
            const barHeight = Math.max(
              (count / yMax) * CHART_HEIGHT,
              count > 0 ? MIN_BAR_HEIGHT : 0,
            )
            return (
              <div
                key={date}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
              >
                <div
                  role="img"
                  aria-label={`${formatDayLabel(date)}: ${count} ${count === 1 ? 'ticket' : 'tickets'}`}
                  tabIndex={0}
                  className="w-full max-w-[20px] rounded-t-sm bg-primary outline-none transition-colors group-hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ height: barHeight }}
                />
                <div className="pointer-events-none absolute bottom-full z-10 mb-1.5 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  {formatDayLabel(date)} · {count.toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div />
      <div className="flex">
        {dailyCounts.map(({ date }, index) => (
          <div key={date} className="flex-1 text-center text-[10px] text-muted-foreground">
            {index % X_LABEL_INTERVAL === 0 || index === dailyCounts.length - 1
              ? formatDayLabel(date)
              : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TicketsPerDayChart
