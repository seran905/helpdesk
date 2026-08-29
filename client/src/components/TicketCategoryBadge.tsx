import type { TicketCategory } from 'core'

type TicketCategoryBadgeProps = {
  category: TicketCategory | null
}

function TicketCategoryBadge({ category }: TicketCategoryBadgeProps) {
  if (!category) return null

  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
      {category.replace(/_/g, ' ')}
    </span>
  )
}

export default TicketCategoryBadge
