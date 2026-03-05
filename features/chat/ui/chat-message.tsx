'use client';

import { format } from 'date-fns';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { ChatMessageContent } from '@/features/chat/ui/chat-message-content';

import type { Message } from '@/features/chat/types';

interface ChatMessageProps {
  message: Message;
}

/**
 * ChatMessage component.
 * @param props - Component props.
 * @param props.message
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const [copied, setCopied] = useState(false);

  /**
   * copyToClipboard.
   * @returns Promise.
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => {
        return setCopied(false);
      }, 2000);
    } catch {
      // clipboard not available (e.g. non-secure context) — silently ignore
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}
      >
        {/* Bubble */}
        <div
          className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card border border-border rounded-tl-sm text-foreground'
          }`}
        >
          {isUser ? (
            <p className='whitespace-pre-wrap break-words'>{message.content}</p>
          ) : (
            <ChatMessageContent content={message.content} />
          )}
        </div>

        {/* Meta row: time + copy */}
        <div
          className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <time className='text-xs text-muted-foreground'>
            {format(new Date(message.created_at), 'HH:mm')}
          </time>
          <button
            onClick={copyToClipboard}
            className='cursor-pointer text-muted-foreground hover:text-foreground transition-colors'
            aria-label='Copy message'
            title='Copy message'
          >
            {copied ? (
              <Check className='w-3.5 h-3.5 text-primary' />
            ) : (
              <Copy className='w-3.5 h-3.5' />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
