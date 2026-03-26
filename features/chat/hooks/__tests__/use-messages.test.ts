/* eslint-disable max-statements */
import { act, renderHook } from '@testing-library/react';

import { useMessages } from '@/features/chat/hooks/use-messages';

import type { Message } from '@/features/chat/types';

jest.mock('@/shared/lib/config', () => {
  return { API_URL: 'http://localhost' };
});

const mockGetMessages = jest.fn();

jest.mock('@/features/chat/api/messages', () => {
  return {
    getMessages: (...args: unknown[]) => {
      return mockGetMessages(...args);
    },
  };
});

// IntersectionObserver mock that captures the callback so tests can trigger it
type IOCallback = (entries: { isIntersecting: boolean }[]) => void;
let capturedIOCallback: IOCallback | null = null;

beforeAll(() => {
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((cb: IOCallback) => {
      capturedIOCallback = cb;

      return {
        observe: jest.fn(),
        disconnect: jest.fn(),
        unobserve: jest.fn(),
      };
    }),
  });
});

const makeMessage = (id: number, overrides: Partial<Message> = {}): Message => {
  return {
    id,
    chat_id: 1,
    role: 'user',
    status: null,
    content: `Message ${id}`,
    followup_data: null,
    error_message: null,
    failure_code: null,
    agent_run_uuid: null,
    current_attempt: null,
    max_attempts: null,
    completed_at: null,
    next_retry_at: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
};
const INITIAL_MESSAGES: Message[] = [
  makeMessage(1),
  makeMessage(2),
  makeMessage(3),
];

describe('useMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedIOCallback = null;
    mockGetMessages.mockResolvedValue({ messages: [], totalCount: 0 });
  });

  it('returns initial messages', () => {
    const { result } = renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 3, 0);
    });

    expect(result.current.messages).toEqual(INITIAL_MESSAGES);
  });

  it('hasMore is false when startOffset is 0', () => {
    const { result } = renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 3, 0);
    });

    expect(result.current.hasMore).toBe(false);
  });

  it('hasMore is true when startOffset > 0', () => {
    const { result } = renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 10, 3);
    });

    expect(result.current.hasMore).toBe(true);
  });

  it('isLoading starts as false', () => {
    const { result } = renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 3, 0);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('addMessage appends a single message at the end', () => {
    const { result } = renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 3, 0);
    });
    const newMessage = makeMessage(4);

    act(() => {
      result.current.addMessage(newMessage);
    });

    expect(result.current.messages).toHaveLength(4);
    expect(result.current.messages[3]).toEqual(newMessage);
  });

  it('addMessage preserves existing messages', () => {
    const { result } = renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 3, 0);
    });

    act(() => {
      result.current.addMessage(makeMessage(4));
    });

    expect(result.current.messages[0]).toEqual(INITIAL_MESSAGES[0]);
    expect(result.current.messages[1]).toEqual(INITIAL_MESSAGES[1]);
    expect(result.current.messages[2]).toEqual(INITIAL_MESSAGES[2]);
  });

  it('addMessages appends multiple messages', () => {
    const { result } = renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 3, 0);
    });

    act(() => {
      result.current.addMessages([makeMessage(4), makeMessage(5)]);
    });

    expect(result.current.messages).toHaveLength(5);
    expect(result.current.messages[3]).toEqual(makeMessage(4));
    expect(result.current.messages[4]).toEqual(makeMessage(5));
  });

  it('addMessages preserves existing messages', () => {
    const { result } = renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 3, 0);
    });

    act(() => {
      result.current.addMessages([makeMessage(4), makeMessage(5)]);
    });

    expect(result.current.messages[0]).toEqual(INITIAL_MESSAGES[0]);
  });

  it('addMessages can append to an empty list', () => {
    const { result } = renderHook(() => {
      return useMessages(1, [], 0, 0);
    });

    act(() => {
      result.current.addMessages([makeMessage(1), makeMessage(2)]);
    });

    expect(result.current.messages).toHaveLength(2);
  });

  it('multiple addMessage calls accumulate', () => {
    const { result } = renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 3, 0);
    });

    act(() => {
      result.current.addMessage(makeMessage(4));
    });
    act(() => {
      result.current.addMessage(makeMessage(5));
    });

    expect(result.current.messages).toHaveLength(5);
  });

  it('exposes sentinelRef and containerRef', () => {
    const { result } = renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 3, 0);
    });

    expect(result.current.sentinelRef).toBeDefined();
    expect(result.current.containerRef).toBeDefined();
  });

  it('assistant role messages are stored correctly', () => {
    const assistantMsg = makeMessage(10, { role: 'assistant' });
    const { result } = renderHook(() => {
      return useMessages(1, [assistantMsg], 1, 0);
    });

    expect(result.current.messages[0].role).toBe('assistant');
  });

  it('loadOlder does not fire when hasMore is false (startOffset=0)', async () => {
    renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 3, 0);
    });

    // Fire intersection — should be a no-op because hasMore=false
    await act(async () => {
      capturedIOCallback?.([{ isIntersecting: true }]);
    });

    expect(mockGetMessages).not.toHaveBeenCalled();
  });

  it('loadOlder sets isLoading to false after resolving via IntersectionObserver', async () => {
    mockGetMessages.mockResolvedValue({ messages: [], totalCount: 5 });

    // Use renderHook with initializer that creates a real sentinel element
    const { result, rerender } = renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 5, 3);
    });
    // The hook won't observe until sentinelRef.current is set.
    // We simulate by attaching a real element to the ref manually.
    const sentinel = document.createElement('div');

    // Force the ref to point at a real element by mutating it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result.current.sentinelRef as any).current = sentinel;
    // Re-run the effect by re-rendering
    rerender();

    // Now capturedIOCallback should be set; trigger it
    await act(async () => {
      capturedIOCallback?.([{ isIntersecting: true }]);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('loadOlder silently handles fetch errors', async () => {
    mockGetMessages.mockRejectedValue(new Error('Network error'));

    const { result, rerender } = renderHook(() => {
      return useMessages(1, INITIAL_MESSAGES, 5, 3);
    });
    const sentinel = document.createElement('div');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result.current.sentinelRef as any).current = sentinel;
    rerender();

    await act(async () => {
      capturedIOCallback?.([{ isIntersecting: true }]);
    });

    // Messages should be unchanged, isLoading restored
    expect(result.current.messages).toEqual(INITIAL_MESSAGES);
    expect(result.current.isLoading).toBe(false);
  });
});
