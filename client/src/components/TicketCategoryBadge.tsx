import { TicketCategory } from 'core'

export const categoryBadgeColors: Record<TicketCategory, string> = {
  [TicketCategory.general_question]:
    'border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  [TicketCategory.technical_question]:
    'border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  [TicketCategory.refund_request]:
    'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export const uncategorizedBadgeColor = 'border-border bg-muted text-muted-foreground'

type TicketCategoryBadgeProps = {
  category: TicketCategory | null
}

function TicketCategoryBadge({ category }: TicketCategoryBadgeProps) {
  if (!category) return null

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${categoryBadgeColors[category]}`}
    >
      {category.replace(/_/g, ' ')}
    </span>
  )
}

export default TicketCategoryBadge
