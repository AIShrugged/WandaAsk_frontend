/* eslint-disable jsdoc/require-jsdoc */
import { act, renderHook } from '@testing-library/react';

import { useMessages } from '@/features/chat/hooks/use-messages';

import type { Message } from '@/features/chat/types';

jest.mock('@/shared/lib/config', () => {
  return { API_URL: 'http://localhost' };
});

jest.mock('@/features/chat/api/messages');

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

const makeMessage = (id: number, overrides: Partial<Message> = {}): Message => {
  return {
    id,
    chat_id: 1,
    role: 'user',
    content: `Message ${id}`,
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
});
