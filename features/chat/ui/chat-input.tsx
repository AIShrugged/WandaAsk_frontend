'use client';

import { SendHorizontal } from 'lucide-react';
import { useRef, useState } from 'react';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue('');
    onSend(trimmed);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className='flex items-end gap-2 border-primary rounded-2xl bg-white px-4 py-3 shadow-primary'>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={1}
        placeholder='Type a message… (Enter to send, Shift+Enter for new line)'
        disabled={disabled}
        onKeyDown={handleKeyDown}
        className='flex-1 resize-none bg-transparent text-sm text-primary placeholder:text-placeholder outline-none leading-relaxed max-h-40 overflow-y-auto disabled:opacity-50'
        style={{ fieldSizing: 'content' } as React.CSSProperties}
      />
      <button
        type='button'
        onClick={submit}
        disabled={disabled || !value.trim()}
        className='flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white transition-opacity hover:opacity-80 disabled:opacity-40'
        aria-label='Send message'
      >
        <SendHorizontal className='w-4 h-4' />
      </button>
    </div>
  );
}
