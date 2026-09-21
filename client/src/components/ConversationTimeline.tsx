import { SenderType } from 'core'
import { formatShortDateTime } from '@/lib/formatDate'
import type { TicketMessage } from '@/types/ticket'

const markerColors: Record<SenderType, string> = {
  [SenderType.customer]: 'bg-muted-foreground/40',
  [SenderType.agent]: 'bg-primary',
  [SenderType.ai]: 'bg-fuchsia-500',
}

const senderBadge: Partial<Record<SenderType, { label: string; className: string }>> = {
  [SenderType.agent]: {
    label: 'Agent',
    className: 'border-primary/25 bg-primary/10 text-primary',
  },
  [SenderType.ai]: {
    label: 'AI',
    className: 'border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
  },
}

type ConversationTimelineProps = {
  messages: TicketMessage[]
}

function ConversationTimeline({ messages }: ConversationTimelineProps) {
  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">No messages yet.</p>
  }

  return (
    <ol>
      {messages.map((message, index) => {
        const badge = senderBadge[message.senderType]
        const isLast = index === messages.length - 1

        return (
          <li key={message.id} className="flex gap-4">
            <div className="flex w-2.5 shrink-0 flex-col items-center">
              <span
                className={`mt-1.5 size-2.5 shrink-0 rounded-full ${markerColors[message.senderType]}`}
              />
              {!isLast && <span className="mt-1 w-px grow bg-border" />}
            </div>
            <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-6'}`}>
              <div className="mb-1.5 flex items-baseline justify-between gap-4">
                <span className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{message.senderName}</span>
                  {badge && (
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatShortDateTime(message.createdAt)}
                </span>
              </div>
              <p className="max-w-[68ch] text-[15px] leading-relaxed whitespace-pre-line text-foreground">
                {message.body}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default ConversationTimeline
