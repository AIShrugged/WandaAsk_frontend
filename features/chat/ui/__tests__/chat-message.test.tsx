/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import { ChatMessage } from '@/features/chat/ui/chat-message';

import type { Message } from '@/features/chat/types';

// Keep ChatMessageContent simple — its own rendering is tested separately
jest.mock('@/features/chat/ui/chat-message-content', () => {
  return {
    ChatMessageContent: ({ content }: { content: string }) => {
      return <div data-testid='chat-message-content'>{content}</div>;
    },
  };
});

const baseMessage: Message = {
  id: 1,
  chat_id: 10,
  role: 'user',
  content: 'Hello world',
  created_at: '2024-01-15T12:00:00.000Z',
};

describe('ChatMessage', () => {
  it('displays the message content', () => {
    render(<ChatMessage message={baseMessage} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('aligns user messages to the right', () => {
    const { container } = render(<ChatMessage message={baseMessage} />);

    expect(container.firstChild).toHaveClass('justify-end');
  });

  it('aligns assistant messages to the left', () => {
    const assistantMessage: Message = {
      ...baseMessage,
      role: 'assistant',
      content: 'Hi there',
    };

    const { container } = render(<ChatMessage message={assistantMessage} />);

    expect(container.firstChild).toHaveClass('justify-start');
  });

  it('renders ChatMessageContent for assistant messages', () => {
    const assistantMessage: Message = {
      ...baseMessage,
      role: 'assistant',
      content: 'AI response',
    };

    render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByTestId('chat-message-content')).toBeInTheDocument();
  });

  it('renders plain text directly for user messages', () => {
    render(<ChatMessage message={baseMessage} />);
    expect(
      screen.queryByTestId('chat-message-content'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
