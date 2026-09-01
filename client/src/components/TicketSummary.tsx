import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { SparklesIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'

type TicketSummaryProps = {
  ticketId: string
}

function TicketSummary({ ticketId }: TicketSummaryProps) {
  const [error, setError] = useState<string>()

  const summarize = useMutation({
    mutationFn: () =>
      apiClient
        .post(`/api/tickets/${ticketId}/summary`)
        .then((res) => res.data.summary as string),
  })

  const onSummarize = async () => {
    setError(undefined)
    try {
      await summarize.mutateAsync()
    } catch (err) {
      setError(
        isAxiosError<{ error?: string }>(err)
          ? (err.response?.data?.error ?? 'Failed to summarize ticket')
          : 'Failed to summarize ticket',
      )
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onSummarize}
        disabled={summarize.isPending}
        className="self-start"
      >
        <SparklesIcon />
        {summarize.isPending ? 'Summarizing...' : 'Summarize'}
      </Button>

      {error && (
        <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white">
            !
          </span>
          {error}
        </p>
      )}

      {summarize.data && (
        <div className="rounded-md border border-border bg-muted/30 p-4">
          <p className="whitespace-pre-wrap text-sm text-foreground">{summarize.data}</p>
        </div>
      )}
    </div>
  )
}

export default TicketSummary
