import { SenderType } from 'core'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ReplyThread from '@/components/ReplyThread'
import type { TicketMessage } from '@/types/ticket'

const replies: TicketMessage[] = [
  {
    id: 2,
    senderName: 'Agent Smith',
    senderType: SenderType.agent,
    body: 'Can you try resetting your password?',
    createdAt: '2026-08-29T00:30:00.000Z',
  },
  {
    id: 3,
    senderName: 'Jane Doe',
    senderType: SenderType.customer,
    body: 'That worked, thanks!',
    createdAt: '2026-08-29T01:00:00.000Z',
  },
]

describe('ReplyThread', () => {
  it('shows a fallback when there are no replies', () => {
    render(<ReplyThread replies={[]} />)

    expect(screen.getByText('No replies yet.')).toBeInTheDocument()
  })

  it('renders each reply with its sender and body', () => {
    render(<ReplyThread replies={replies} />)

    expect(screen.getByText('Can you try resetting your password?')).toBeInTheDocument()
    expect(screen.getByText('That worked, thanks!')).toBeInTheDocument()
    expect(
      screen.getByText(new Date(replies[0]!.createdAt).toLocaleString()),
    ).toBeInTheDocument()
  })

  it('badges agent replies but not customer replies', () => {
    render(<ReplyThread replies={replies} />)

    const agentReply = screen.getByText('Can you try resetting your password?').closest('div')
    const customerReply = screen.getByText('That worked, thanks!').closest('div')

    expect(agentReply).toHaveTextContent('Agent')
    expect(customerReply).not.toHaveTextContent('Agent')
  })
})
