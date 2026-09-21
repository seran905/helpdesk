import BackLink from '@/components/BackLink'
import { Skeleton } from '@/components/ui/skeleton'

function TicketDetailSkeleton() {
  return (
    <div className="px-8 py-10">
      <BackLink />
      <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-3">
        <div className="space-y-8 sm:col-span-2">
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-9 w-96" />
          </div>
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>
        <Skeleton className="h-72 w-full rounded-md" />
      </div>
    </div>
  )
}

export default TicketDetailSkeleton
