import {
  CalendarSearch,
  ClipboardList,
  Sparkles,
  UserSearch,
} from 'lucide-react';

import type React from 'react';

interface Suggestion {
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

const SUGGESTIONS: Suggestion[] = [
  {
    label: 'Создать методологию оценки',
    prompt: 'Помоги создать методологию оценки сотрудников',
    icon: <Sparkles className='w-3.5 h-3.5' />,
  },
  {
    label: 'Профиль сотрудника',
    prompt: 'Покажи профиль и инсайты по сотруднику',
    icon: <UserSearch className='w-3.5 h-3.5' />,
  },
  {
    label: 'Встречи за неделю',
    prompt: 'Найди все встречи за последнюю неделю',
    icon: <CalendarSearch className='w-3.5 h-3.5' />,
  },
  {
    label: 'Создать задачу',
    prompt: 'Создай задачу для сотрудника',
    icon: <ClipboardList className='w-3.5 h-3.5' />,
  },
];

interface ChatSuggestionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

/**
 * ChatSuggestions component — quick prompt chips for empty chat state.
 * @param props - Component props.
 * @param props.onSelect - Callback invoked with the selected prompt text.
 * @param props.disabled - Disables all suggestion buttons.
 * @returns JSX element.
 */
export function ChatSuggestions({ onSelect, disabled }: ChatSuggestionsProps) {
  return (
    <div className='flex-1 flex flex-col items-center justify-center gap-6 px-4'>
      <div className='text-center'>
        <p className='text-sm font-medium text-foreground'>Чем могу помочь?</p>
        <p className='text-xs text-muted-foreground mt-1'>
          Выберите подсказку или напишите свой вопрос
        </p>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md'>
        {SUGGESTIONS.map((s) => {
          return (
            <button
              key={s.prompt}
              type='button'
              disabled={disabled}
              onClick={() => {
                return onSelect(s.prompt);
              }}
              className='flex items-center gap-2.5 px-4 py-3 rounded-[var(--radius-card)] border border-border bg-background text-left text-sm text-foreground hover:bg-accent/50 hover:border-primary/30 transition-colors disabled:opacity-50 cursor-pointer'
            >
              <span className='text-primary flex-shrink-0'>{s.icon}</span>
              <span className='leading-snug'>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
