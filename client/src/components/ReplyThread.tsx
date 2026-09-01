import { SenderType } from 'core'
import type { TicketMessage } from '@/components/TicketDetails'

type ReplyThreadProps = {
  replies: TicketMessage[]
}

function ReplyThread({ replies }: ReplyThreadProps) {
  return (
    <div className="pt-2">
      <h2 className="mb-3 text-lg font-semibold text-foreground">Replies</h2>
      {replies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No replies yet.</p>
      ) : (
        <div className="space-y-4">
          {replies.map((message) => (
            <div key={message.id} className="rounded-md border border-border p-4">
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <span className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{message.senderName}</span>
                  {message.senderType === SenderType.agent && (
                    <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      Agent
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{message.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReplyThread
