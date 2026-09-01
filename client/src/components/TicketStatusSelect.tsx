import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TicketStatus } from 'core'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/lib/api-client'

const statusItems = Object.values(TicketStatus).map((status) => ({
  value: status,
  label: status,
}))

type TicketStatusSelectProps = {
  ticketId: string
  status: TicketStatus
}

function TicketStatusSelect({ ticketId, status }: TicketStatusSelectProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (nextStatus: TicketStatus) =>
      apiClient.patch(`/api/tickets/${ticketId}/status`, { status: nextStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  return (
    <Select
      items={statusItems}
      value={status}
      disabled={isPending}
      onValueChange={(value) => mutate(value as TicketStatus)}
    >
      <SelectTrigger
        aria-label="Status"
        className="w-1/2 rounded-md border border-border bg-background capitalize shadow-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusItems.map((item) => (
          <SelectItem key={item.value} value={item.value} className="capitalize">
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default TicketStatusSelect
