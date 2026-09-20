import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AI_PROCESSING_STATUSES, TicketStatus } from 'core'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/lib/api-client'

// All statuses, used so the trigger can still show a label if a ticket is
// ever viewed while AI-owned (new/processing) — see settableStatusItems below
// for the options an agent can actually pick.
const statusItems = Object.values(TicketStatus).map((status) => ({
  value: status,
  label: status,
}))

const settableStatusItems = statusItems.filter(
  (item) => !(AI_PROCESSING_STATUSES as readonly string[]).includes(item.value),
)

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
        {settableStatusItems.map((item) => (
          <SelectItem key={item.value} value={item.value} className="capitalize">
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default TicketStatusSelect
