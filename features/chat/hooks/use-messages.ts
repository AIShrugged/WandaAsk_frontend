'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getMessages } from '@/features/chat/api/messages';

import type { Message } from '@/features/chat/types';

const PAGE_SIZE = 10;

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

  const loadOlder = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const container = containerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    setIsLoading(true);
    try {
      const fetchOffset = Math.max(0, loadedStartOffset - PAGE_SIZE);
      const fetchCount = loadedStartOffset - fetchOffset;

      const { messages: older } = await getMessages(chatId, fetchOffset, fetchCount);

      // Prepend older messages (they're already in chronological order)
      setMessages(prev => [...older, ...prev]);
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
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadOlder]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    });
  }, []);

  const addMessage = useCallback(
    (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    },
    [scrollToBottom],
  );

  const addMessages = useCallback(
    (incoming: Message[]) => {
      setMessages(prev => [...prev, ...incoming]);
      scrollToBottom();
    },
    [scrollToBottom],
  );

  return { messages, isLoading, hasMore, sentinelRef, containerRef, addMessage, addMessages };
}
