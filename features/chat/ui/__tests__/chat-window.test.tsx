/* eslint-disable jsdoc/require-jsdoc */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatWindow } from '@/features/chat/ui/chat-window';

import type { Message } from '@/features/chat/types';

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
    },
    usePathname: () => {
      return '/dashboard/chat/1';
    },
    useSearchParams: () => {
      return new URLSearchParams();
    },
  };
});

jest.mock('@/shared/lib/config', () => {
  return { API_URL: 'http://localhost' };
});

const mockAddMessage = jest.fn();

const mockAddMessages = jest.fn();

const mockSendMessage = jest.fn();

const mockToastError = jest.fn();

jest.mock('@/features/chat/hooks/use-messages', () => {
  return {
    useMessages: () => {
      return {
        messages: [] as Message[],
        isLoading: false,
        hasMore: false,
        sentinelRef: { current: null },
        containerRef: { current: null },
        addMessage: mockAddMessage,
        addMessages: mockAddMessages,
      };
    },
  };
});

jest.mock('@/features/chat/api/messages', () => {
  return {
    sendMessage: (...args: unknown[]) => {
      return mockSendMessage(...args);
    },
  };
});

jest.mock('sonner', () => {
  return {
    toast: {
      error: (...args: unknown[]) => {
        return mockToastError(...args);
      },
    },
  };
});

jest.mock('@/features/chat/ui/chat-input', () => {
  return {
    ChatInput: ({
      onSend,
      disabled,
    }: {
      onSend: (content: string) => void;
      disabled: boolean;
    }) => {
      return (
        <div>
          <button
            disabled={disabled}
            onClick={() => {
              return onSend('hello world');
            }}
            data-testid='send-btn'
          >
            Send
          </button>
        </div>
      );
    },
  };
});

jest.mock('@/features/chat/ui/chat-message', () => {
  return {
    ChatMessage: ({ message }: { message: Message }) => {
      return <div data-testid='chat-message'>{message.content}</div>;
    },
  };
});

jest.mock('@/features/chat/ui/thinking-indicator', () => {
  return {
    ThinkingIndicator: () => {
      return <div data-testid='thinking-indicator' />;
    },
  };
});

beforeAll(() => {
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation(() => {
      return {
        observe: jest.fn(),
        disconnect: jest.fn(),
        unobserve: jest.fn(),
      };
    }),
  });
});

const makeMessage = (
  id: number,
  role: 'user' | 'assistant' = 'user',
): Message => {
  return {
    id,
    chat_id: 1,
    role,
    status: null,
    content: `message ${id}`,
    followup_data: null,
    error_message: null,
    failure_code: null,
    agent_run_uuid: null,
    current_attempt: null,
    max_attempts: null,
    completed_at: null,
    next_retry_at: null,
    created_at: '2024-01-01T00:00:00Z',
  };
};

describe('ChatWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chat input', () => {
    render(
      <ChatWindow
        chatId={1}
        initialMessages={[]}
        totalCount={0}
        startOffset={0}
      />,
    );

    expect(screen.getByTestId('send-btn')).toBeInTheDocument();
  });

  it('renders collapse button when onCollapse is provided', () => {
    render(
      <ChatWindow
        chatId={1}
        initialMessages={[]}
        totalCount={0}
        startOffset={0}
        onCollapse={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Collapse chat panel')).toBeInTheDocument();
  });

  it('does not render collapse button when onCollapse is absent', () => {
    render(
      <ChatWindow
        chatId={1}
        initialMessages={[]}
        totalCount={0}
        startOffset={0}
      />,
    );

    expect(
      screen.queryByLabelText('Collapse chat panel'),
    ).not.toBeInTheDocument();
  });

  it('calls onCollapse when collapse button is clicked', async () => {
    const onCollapse = jest.fn();

    const user = userEvent.setup();

    render(
      <ChatWindow
        chatId={1}
        initialMessages={[]}
        totalCount={0}
        startOffset={0}
        onCollapse={onCollapse}
      />,
    );

    await user.click(screen.getByLabelText('Collapse chat panel'));

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no messages', () => {
    render(
      <ChatWindow
        chatId={1}
        initialMessages={[]}
        totalCount={0}
        startOffset={0}
      />,
    );

    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it('calls sendMessage and addMessage when send button clicked', async () => {
    mockSendMessage.mockResolvedValueOnce(makeMessage(99, 'assistant'));

    const user = userEvent.setup();

    render(
      <ChatWindow
        chatId={5}
        initialMessages={[]}
        totalCount={0}
        startOffset={0}
      />,
    );

    await user.click(screen.getByTestId('send-btn'));

    expect(mockAddMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'hello world',
        role: 'user',
        chat_id: 5,
      }),
    );
    expect(mockSendMessage).toHaveBeenCalledWith(5, 'hello world');
  });

  it('adds queued assistant message after send', async () => {
    const assistantMsg = makeMessage(99, 'assistant');

    mockSendMessage.mockResolvedValueOnce(assistantMsg);

    const user = userEvent.setup();

    render(
      <ChatWindow
        chatId={1}
        initialMessages={[]}
        totalCount={0}
        startOffset={0}
      />,
    );

    await user.click(screen.getByTestId('send-btn'));

    await waitFor(() => {
      expect(mockAddMessage).toHaveBeenCalledWith(assistantMsg);
    });
  });

  it('shows error toast when sendMessage fails', async () => {
    mockSendMessage.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();

    render(
      <ChatWindow
        chatId={1}
        initialMessages={[]}
        totalCount={0}
        startOffset={0}
      />,
    );

    await user.click(screen.getByTestId('send-btn'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Network error');
    });
  });
});
