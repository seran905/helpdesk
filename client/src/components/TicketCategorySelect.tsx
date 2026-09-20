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
        className="w-1/2 rounded-md border border-border bg-background capitalize shadow-none"
      >
        <SelectValue />
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
