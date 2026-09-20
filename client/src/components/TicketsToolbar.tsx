import { AI_PROCESSING_STATUSES, TicketCategoryFilter, TicketStatus } from 'core'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ALL_CATEGORIES, ALL_STATUSES } from '@/hooks/useTicketFilters'

const statusLabels: Record<TicketStatus, string> = {
  [TicketStatus.new]: 'New',
  [TicketStatus.processing]: 'Processing',
  [TicketStatus.open]: 'Open',
  [TicketStatus.resolved]: 'Resolved',
  [TicketStatus.closed]: 'Closed',
}

// AI-owned tickets (new/processing) aren't offered as a filter — they're
// always excluded from the list until the AI pipeline hands them off.
const filterableStatuses = Object.values(TicketStatus).filter(
  (status) => !(AI_PROCESSING_STATUSES as readonly string[]).includes(status),
)

const categoryLabels: Record<TicketCategoryFilter, string> = {
  [TicketCategoryFilter.general_question]: 'General Question',
  [TicketCategoryFilter.technical_question]: 'Technical Question',
  [TicketCategoryFilter.refund_request]: 'Refund Request',
  [TicketCategoryFilter.uncategorized]: 'Uncategorized',
}

const statusItems = [
  { value: ALL_STATUSES, label: 'All statuses' },
  ...Object.values(TicketStatus).map((value) => ({ value, label: statusLabels[value] })),
]

const categoryItems = [
  { value: ALL_CATEGORIES, label: 'All categories' },
  ...Object.values(TicketCategoryFilter).map((value) => ({ value, label: categoryLabels[value] })),
]

type TicketsToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  status: TicketStatus | typeof ALL_STATUSES
  onStatusChange: (value: TicketStatus | typeof ALL_STATUSES) => void
  category: TicketCategoryFilter | typeof ALL_CATEGORIES
  onCategoryChange: (value: TicketCategoryFilter | typeof ALL_CATEGORIES) => void
}

function TicketsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
}: TicketsToolbarProps) {
  const fieldClassName = 'h-8 rounded-md border border-border bg-background shadow-none'

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 p-3">
      <Input
        placeholder="Search subject or requester..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`max-w-xs ${fieldClassName}`}
      />
      <Select
        items={statusItems}
        value={status}
        onValueChange={(value) => onStatusChange(value as TicketStatus | typeof ALL_STATUSES)}
      >
        <SelectTrigger aria-label="Filter by status" className={fieldClassName}>
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
          {filterableStatuses.map((value) => (
            <SelectItem key={value} value={value}>
              {statusLabels[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={categoryItems}
        value={category}
        onValueChange={(value) =>
          onCategoryChange(value as TicketCategoryFilter | typeof ALL_CATEGORIES)
        }
      >
        <SelectTrigger aria-label="Filter by category" className={fieldClassName}>
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
          {Object.values(TicketCategoryFilter).map((value) => (
            <SelectItem key={value} value={value}>
              {categoryLabels[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default TicketsToolbar
