'use client';

import { SendHorizontal } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

// field-sizing: content requires Chrome 123+; this detects support at module load time
const supportsFieldSizing =
  typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content');

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * ChatInput component.
 * @param props - Component props.
 * @param props.onSend - Callback invoked with the trimmed message content when the user submits.
 * @param props.disabled - Disables the input and send button when true.
 * @param props.placeholder
 * @returns Result.
 */
export function ChatInput({
  onSend,
  disabled,
  placeholder = 'Message…',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fallback auto-resize for browsers without field-sizing: content (e.g. Firefox).
  // useLayoutEffect fires synchronously after DOM mutations — prevents height flash.
  useLayoutEffect(() => {
    if (supportsFieldSizing || !textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);
  /**
   * submit.
   * @returns Result.
   */
  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue('');
    // Reset height for browsers using the JS fallback
    if (!supportsFieldSizing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSend(trimmed);
    textareaRef.current?.focus();
  };
  /**
   * handleKeyDown.
   * @param e - e.
   * @returns Result.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className='flex items-center gap-2 border border-border rounded-[var(--radius-card)] bg-background p-2 shadow-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-colors'>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          return setValue(e.target.value);
        }}
        rows={1}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        className='flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none leading-relaxed max-h-40 overflow-y-auto disabled:opacity-50'
        style={{ fieldSizing: 'content' } as React.CSSProperties}
      />
      <button
        type='button'
        onClick={submit}
        disabled={disabled || !value.trim()}
        className='flex-shrink-0 w-8 h-8 rounded-[var(--radius-button)] bg-primary flex items-center justify-center text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40'
        aria-label='Send message'
      >
        <SendHorizontal className='w-4 h-4' />
      </button>
    </div>
  );
}
