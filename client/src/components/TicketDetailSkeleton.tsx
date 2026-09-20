import BackLink from '@/components/BackLink'
import { Skeleton } from '@/components/ui/skeleton'

function TicketDetailSkeleton() {
  return (
    <div className="px-8 py-10">
      <BackLink />
      <Skeleton className="mb-2 h-9 w-96" />
      <Skeleton className="mb-8 h-24 w-full rounded-md" />
      <Skeleton className="h-32 w-full rounded-md" />
    </div>
  )
}

export default TicketDetailSkeleton
