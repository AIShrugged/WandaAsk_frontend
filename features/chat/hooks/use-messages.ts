'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getMessages } from '@/features/chat/api/messages';

import type { Message } from '@/features/chat/types';

const PAGE_SIZE = 10;

/**
 * useMessages hook.
 * @param chatId - The chat ID to load messages for.
 * @param initialMessages - Initially loaded messages (newest batch).
 * @param totalCount - Total message count in the chat.
 * @param startOffset - Offset from which initialMessages were loaded; 0 means oldest batch.
 * @returns Hook state and helpers for paginated message management.
 */
export function useMessages(
  chatId: number,
  initialMessages: Message[],
  totalCount: number,
  // The offset from which initialMessages were loaded.
  // 0 means we already have the oldest messages.
  // >0 means there are older messages available above.
  startOffset: number,
) {
  // Messages stored in chronological order (oldest first, newest last).
  // API returns oldest-first, so no reversal needed.
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  // Tracks the beginning offset of what we've loaded so far.
  const [loadedStartOffset, setLoadedStartOffset] = useState(startOffset);

  const [isLoading, setIsLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // There are older messages if we haven't loaded from offset 0 yet.
  const hasMore = loadedStartOffset > 0;

  /**
   * loadOlder.
   * @returns Promise.
   */
  const loadOlder = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const container = containerRef.current;

    const prevScrollHeight = container?.scrollHeight ?? 0;

    setIsLoading(true);
    try {
      const fetchOffset = Math.max(0, loadedStartOffset - PAGE_SIZE);

      const fetchCount = loadedStartOffset - fetchOffset;

      const { messages: older } = await getMessages(
        chatId,
        fetchOffset,
        fetchCount,
      );

      // Prepend older messages (they're already in chronological order)
      setMessages((prev) => {
        return [...older, ...prev];
      });
      setLoadedStartOffset(fetchOffset);

      // Restore scroll position so viewport doesn't jump
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [chatId, loadedStartOffset, isLoading, hasMore]);

  // Intersection observer on the top sentinel — fires when user scrolls up
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          void loadOlder();
        }
      },
      { rootMargin: '40px' },
    );

    observer.observe(sentinelRef.current);

    return () => {
      return observer.disconnect();
    };
  }, [hasMore, isLoading, loadOlder]);

  const shouldScrollToBottom = useRef(false);

  // Scroll after React commits the DOM update
  useEffect(() => {
    if (shouldScrollToBottom.current && containerRef.current) {
      shouldScrollToBottom.current = false;
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * addMessage.
   * @param message - Message to append and scroll to.
   * @returns Result.
   */
  const addMessage = useCallback((message: Message) => {
    shouldScrollToBottom.current = true;
    setMessages((prev) => {
      return [...prev, message];
    });
  }, []);

  /**
   * addMessages.
   * @param incoming - Messages to append and scroll to.
   * @returns Result.
   */
  const addMessages = useCallback((incoming: Message[]) => {
    shouldScrollToBottom.current = true;
    setMessages((prev) => {
      return [...prev, ...incoming];
    });
  }, []);

  /**
   * updateMessage — patches a message in-place by id.
   * @param id - ID of the message to update.
   * @param patch - Partial fields to merge.
   * @returns Result.
   */
  const updateMessage = useCallback((id: number, patch: Partial<Message>) => {
    setMessages((prev) => {
      return prev.map((m) => {
        return m.id === id ? { ...m, ...patch } : m;
      });
    });
  }, []);

  return {
    messages,
    isLoading,
    hasMore,
    sentinelRef,
    containerRef,
    addMessage,
    addMessages,
    updateMessage,
  };
}
