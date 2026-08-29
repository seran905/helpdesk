import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/lib/api-client'

const UNASSIGNED = 'unassigned'

type Agent = { id: string; name: string }

type TicketAssigneeSelectProps = {
  ticketId: string
  assignedTo: { id: string; name: string } | null
}

function TicketAssigneeSelect({ ticketId, assignedTo }: TicketAssigneeSelectProps) {
  const queryClient = useQueryClient()

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.get('/api/users/agents').then((res) => res.data.agents as Agent[]),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (assignedToId: string | null) =>
      apiClient.patch(`/api/tickets/${ticketId}/assign`, { assignedToId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  // Fall back to the currently assigned agent (already known from props) so the
  // trigger doesn't show a raw id while the full agent list is still loading.
  const agentOptions = agents ?? (assignedTo ? [assignedTo] : [])

  const items = [
    { value: UNASSIGNED, label: 'Unassigned' },
    ...agentOptions.map((agent) => ({ value: agent.id, label: agent.name })),
  ]

  return (
    <Select
      items={items}
      value={assignedTo?.id ?? UNASSIGNED}
      disabled={isPending}
      onValueChange={(value) => mutate(value === UNASSIGNED ? null : value)}
    >
      <SelectTrigger
        size="sm"
        aria-label="Assigned To"
        className="inline-flex h-7 rounded-md border border-border bg-background text-sm shadow-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default TicketAssigneeSelect
