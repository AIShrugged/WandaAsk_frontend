'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getMessages } from '@/features/chat/api/messages';

import type { Message } from '@/features/chat/types';

const PAGE_SIZE = 50;

export function useMessages(
  chatId: number,
  initialMessages: Message[],
  initialTotal: number,
) {
  // Messages stored in chronological order (oldest first, newest last)
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [offset, setOffset] = useState(initialMessages.length);
  const [hasMore, setHasMore] = useState(initialMessages.length < initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadOlder = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const container = containerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    setIsLoading(true);
    try {
      const { messages: older, totalCount } = await getMessages(
        chatId,
        offset,
        PAGE_SIZE,
      );

      setMessages(prev => [...older.toReversed(), ...prev]);
      setOffset(prev => prev + older.length);
      setHasMore(offset + older.length < totalCount);

      // Restore scroll position after prepend
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop =
            container.scrollHeight - prevScrollHeight;
        }
      });
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [chatId, offset, isLoading, hasMore]);

  // Intersection observer on the top sentinel
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
