import { SenderType } from 'core'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConversationTimeline from '@/components/ConversationTimeline'
import type { TicketMessage } from '@/types/ticket'

const messages: TicketMessage[] = [
  {
    id: 1,
    senderName: 'Jane Doe',
    senderType: SenderType.customer,
    body: "I can't log in to my account.",
    createdAt: '2026-08-29T00:15:00.000Z',
  },
  {
    id: 2,
    senderName: 'Agent Smith',
    senderType: SenderType.agent,
    body: 'Can you try resetting your password?',
    createdAt: '2026-08-29T00:30:00.000Z',
  },
  {
    id: 3,
    senderName: 'Helpdesk AI',
    senderType: SenderType.ai,
    body: 'Suggested next step: ask for a screenshot of the error.',
    createdAt: '2026-08-29T00:45:00.000Z',
  },
]

describe('ConversationTimeline', () => {
  it('shows a fallback when there are no messages', () => {
    render(<ConversationTimeline messages={[]} />)

    expect(screen.getByText('No messages yet.')).toBeInTheDocument()
  })

  it('renders every message with its sender and body, in order', () => {
    render(<ConversationTimeline messages={messages} />)

    const bodies = screen.getAllByText(
      /log in to my account|resetting your password|screenshot of the error/,
    )
    expect(bodies).toHaveLength(3)
    expect(bodies[0]).toHaveTextContent('log in to my account')
    expect(bodies[2]).toHaveTextContent('screenshot of the error')
  })

  it('marks each message with its sender role for assistive tech, without showing the label as text', () => {
    render(<ConversationTimeline messages={messages} />)

    const customerMessage = screen.getByText("I can't log in to my account.").closest('li')
    const agentMessage = screen.getByText('Can you try resetting your password?').closest('li')
    const aiMessage = screen
      .getByText('Suggested next step: ask for a screenshot of the error.')
      .closest('li')

    expect(customerMessage).toHaveTextContent('Customer')
    expect(customerMessage).not.toHaveTextContent('Agent')
    expect(customerMessage).not.toHaveTextContent('AI')
    expect(agentMessage).toHaveTextContent('Agent')
    expect(aiMessage).toHaveTextContent('AI')
  })
})
