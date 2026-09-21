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

function initials(name: string) {
  const [first, second] = name.trim().split(/\s+/)
  return ((first?.[0] ?? '') + (second?.[0] ?? '')).toUpperCase()
}

// Decorative — the agent's name is always rendered alongside it, so it's
// hidden from the accessible name to avoid announcing/matching "AS Agent Smith".
function AssigneeAvatar({ name }: { name: string | null }) {
  if (!name) {
    return (
      <span
        aria-hidden="true"
        className="size-5 shrink-0 rounded-full border border-dashed border-muted-foreground/40"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
    >
      {initials(name)}
    </span>
  )
}

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
        aria-label="Assigned To"
        className="w-44 rounded-md border border-border bg-background shadow-none"
      >
        <SelectValue className="min-w-0">
          {() => (
            <>
              <AssigneeAvatar name={assignedTo?.name ?? null} />
              <span className="min-w-0 truncate">{assignedTo?.name ?? 'Unassigned'}</span>
            </>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            <AssigneeAvatar name={item.value === UNASSIGNED ? null : item.label} />
            <span className="min-w-0 truncate">{item.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default TicketAssigneeSelect
