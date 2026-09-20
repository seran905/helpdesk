import type { LucideIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type StatCardProps = {
  label: string
  value: string
  icon: LucideIcon
  isPending?: boolean
}

function StatCard({ label, value, icon: Icon, isPending }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-3 text-sm font-medium text-muted-foreground">
          {label}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <span className="text-[28px] font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </span>
        )}
      </CardContent>
    </Card>
  )
}

export default StatCard
