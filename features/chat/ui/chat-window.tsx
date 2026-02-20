'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { sendMessage } from '@/features/chat/api/messages';
import { useMessages } from '@/features/chat/hooks/use-messages';
import { ChatInput } from '@/features/chat/ui/chat-input';
import { ChatMessage } from '@/features/chat/ui/chat-message';

import type { Message } from '@/features/chat/types';

interface ChatWindowProps {
  chatId: number;
  initialMessages: Message[];
  totalCount: number;
  startOffset: number;
}

export function ChatWindow({
  chatId,
  initialMessages,
  totalCount,
  startOffset,
}: ChatWindowProps) {
  const { messages, isLoading, hasMore, sentinelRef, containerRef, addMessage, addMessages } =
    useMessages(chatId, initialMessages, totalCount, startOffset);

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
      {/* Messages area */}
      <div
        ref={containerRef}
        className='flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4'
      >
        {/* Top sentinel — triggers loading older messages */}
        <div ref={sentinelRef} />

        {isLoading && (
          <div className='flex justify-center py-2'>
            <Loader2 className='w-4 h-4 text-accent animate-spin' />
          </div>
        )}

        {!hasMore && messages.length === 0 && !isSending && (
          <div className='flex-1 flex items-center justify-center text-secondary text-sm'>
            No messages yet. Say hello!
          </div>
        )}

        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Typing indicator — shown while waiting for assistant response */}
        {isSending && (
          <div className='flex gap-3'>
            <div className='flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-secondary border-primary text-accent'>
              AI
            </div>
            <div className='rounded-2xl rounded-tl-sm px-4 py-3 bg-white border-primary shadow-primary'>
              <div className='flex items-center gap-1'>
                <span
                  className='block w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-bounce'
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className='block w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-bounce'
                  style={{ animationDelay: '160ms' }}
                />
                <span
                  className='block w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-bounce'
                  style={{ animationDelay: '320ms' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className='flex-shrink-0 px-4 pb-4 pt-2'>
        <ChatInput onSend={handleSend} disabled={isSending} />
      </div>
    </div>
  );
}
