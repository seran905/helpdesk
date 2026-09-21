import { Headset, Sparkles, UserRound } from 'lucide-react'
import { SenderType } from 'core'
import { formatShortDateTime } from '@/lib/formatDate'
import type { TicketMessage } from '@/types/ticket'

const senderMarker: Record<SenderType, { label: string; icon: typeof Headset; className: string }> = {
  [SenderType.customer]: {
    label: 'Customer',
    icon: UserRound,
    className: 'bg-muted text-muted-foreground',
  },
  [SenderType.agent]: {
    label: 'Agent',
    icon: Headset,
    className: 'bg-primary/15 text-primary',
  },
  [SenderType.ai]: {
    label: 'AI',
    icon: Sparkles,
    className: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400',
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
        const marker = senderMarker[message.senderType]
        const isLast = index === messages.length - 1

        return (
          <li key={message.id} className="flex gap-3">
            <div className="flex w-6 shrink-0 flex-col items-center">
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full ${marker.className}`}
              >
                <marker.icon className="size-3.5" />
                <span className="sr-only">{marker.label}</span>
              </span>
              {!isLast && <span className="mt-1 w-px grow bg-border" />}
            </div>
            <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-6'}`}>
              <div className="mb-1.5 flex items-baseline justify-between gap-4">
                <span className="font-medium text-foreground">{message.senderName}</span>
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
