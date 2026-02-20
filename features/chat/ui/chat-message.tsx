import { format } from 'date-fns';

import { ChatMessageContent } from '@/features/chat/ui/chat-message-content';

import type { Message } from '@/features/chat/types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
          isUser
            ? 'bg-primary text-white'
            : 'bg-secondary border-primary text-accent'
        }`}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Bubble */}
      <div
        className={`flex flex-col gap-1 max-w-[75%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-white rounded-tr-sm'
              : 'bg-white border-primary shadow-primary rounded-tl-sm text-primary'
          }`}
        >
          {isUser ? (
            <p className='whitespace-pre-wrap break-words'>{message.content}</p>
          ) : (
            <ChatMessageContent content={message.content} />
          )}
        </div>
        <time className='text-xs text-tertiary px-1'>
          {format(new Date(message.created_at), 'HH:mm')}
        </time>
      </div>
    </div>
  );
}
