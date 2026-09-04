import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type StatCardProps = {
  label: string
  value: string
  isPending?: boolean
}

function StatCard({ label, value, isPending }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
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
