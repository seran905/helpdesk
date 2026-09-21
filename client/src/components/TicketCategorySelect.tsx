import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TicketCategory, TicketCategoryFilter } from 'core'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/lib/api-client'
import { categoryBadgeColors, uncategorizedBadgeColor } from '@/components/TicketCategoryBadge'

const categoryItems = Object.values(TicketCategoryFilter).map((value) => ({
  value,
  label: value.replace(/_/g, ' '),
}))

type TicketCategorySelectProps = {
  ticketId: string
  category: TicketCategory | null
}

function TicketCategorySelect({ ticketId, category }: TicketCategorySelectProps) {
  const queryClient = useQueryClient()
  const value = category ?? TicketCategoryFilter.uncategorized
  const chipColor = category ? categoryBadgeColors[category] : uncategorizedBadgeColor

  const { mutate, isPending } = useMutation({
    mutationFn: (nextValue: TicketCategoryFilter) =>
      apiClient.patch(`/api/tickets/${ticketId}/category`, {
        category: nextValue === TicketCategoryFilter.uncategorized ? null : nextValue,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  return (
    <Select
      items={categoryItems}
      value={value}
      disabled={isPending}
      onValueChange={(nextValue) => mutate(nextValue as TicketCategoryFilter)}
    >
      <SelectTrigger
        aria-label="Category"
        className={`w-44 rounded-md border px-3 py-2 text-sm capitalize shadow-none ${chipColor}`}
      >
        <SelectValue className="min-w-0 truncate" />
      </SelectTrigger>
      <SelectContent>
        {categoryItems.map((item) => (
          <SelectItem key={item.value} value={item.value} className="capitalize">
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default TicketCategorySelect
