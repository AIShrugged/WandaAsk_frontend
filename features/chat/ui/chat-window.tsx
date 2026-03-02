'use client';

import { ChevronLeft, Loader2, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { sendMessage } from '@/features/chat/api/messages';
import { useMessages } from '@/features/chat/hooks/use-messages';
import { ChatInput } from '@/features/chat/ui/chat-input';
import { ChatMessage } from '@/features/chat/ui/chat-message';
import { ThinkingIndicator } from '@/features/chat/ui/thinking-indicator';

import type { Message } from '@/features/chat/types';

interface ChatWindowProps {
  chatId: number;
  initialMessages: Message[];
  totalCount: number;
  startOffset: number;
  onCollapse?: () => void;
}

export function ChatWindow({
  chatId,
  initialMessages,
  totalCount,
  startOffset,
  onCollapse,
}: ChatWindowProps) {
  const {
    messages,
    isLoading,
    hasMore,
    sentinelRef,
    containerRef,
    addMessage,
    addMessages,
  } = useMessages(chatId, initialMessages, totalCount, startOffset);

  const [isSending, setIsSending] = useState(false);

  // Scroll to bottom on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [containerRef]);

  const handleSend = (content: string) => {
    const optimistic: Message = {
      id: Date.now(),
      chat_id: chatId,
      content,
      created_at: new Date().toISOString(),
      followup_data: null,
      role: 'user',
    };
    addMessage(optimistic);
    setIsSending(true);

    sendMessage(chatId, content)
      .then(responses => {
        addMessages(responses.filter(m => m.role === 'assistant'));
      })
      .catch(error => {
        toast.error((error as Error).message);
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  return (
    <div className='flex flex-col flex-1 min-h-0'>
      {/* Header */}
      {onCollapse && (
        <div className='flex items-center justify-between px-4 h-[var(--topbar-height)] border-b border-border flex-shrink-0'>
          <div className='flex items-center gap-2'>
            <MessageSquare className='w-4 h-4 text-primary' />
            <span className='text-sm font-semibold text-foreground'>Chat</span>
          </div>
          <button
            onClick={onCollapse}
            className='p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer'
            aria-label='Collapse chat panel'
          >
            <ChevronLeft className='w-4 h-4' />
          </button>
        </div>
      )}
      {/* Messages area */}
      <div
        ref={containerRef}
        className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4'
      >
        {/* Top sentinel — triggers loading older messages */}
        <div ref={sentinelRef} />

        {isLoading && (
          <div className='flex justify-center py-2'>
            <Loader2 className='w-4 h-4 text-primary animate-spin' />
          </div>
        )}

        {!hasMore && messages.length === 0 && !isSending && (
          <div className='flex-1 flex items-center justify-center text-muted-foreground text-sm'>
            No messages yet. Say hello!
          </div>
        )}

        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Thinking indicator — shown while waiting for assistant response */}
        {isSending && <ThinkingIndicator />}
      </div>

      {/* Input area */}
      <div className='flex-shrink-0 px-4 pb-4 pt-2'>
        <ChatInput onSend={handleSend} disabled={isSending} />
      </div>
    </div>
  );
}
