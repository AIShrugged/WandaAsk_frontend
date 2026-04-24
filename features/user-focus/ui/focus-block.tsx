'use client';

import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Pencil, Target, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { clearUserFocus, setUserFocus } from '../api/focus';

import type { UserFocus } from '../types';

function formatDeadline(deadline: string): string {
  const date = parseISO(deadline);
  const daysLeft = differenceInCalendarDays(date, new Date());
  const label = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (daysLeft < 0) return `${label} · overdue`;
  if (daysLeft === 0) return `${label} · today`;
  if (daysLeft === 1) return `${label} · 1 day left`;
  return `${label} · ${daysLeft} days left`;
}

function FocusHeader() {
  return (
    <div className='flex items-center gap-2 mb-3'>
      <Target className='h-4 w-4 text-primary shrink-0' />
      <span className='text-sm font-medium text-foreground'>Active Focus</span>
    </div>
  );
}

function FocusText({ focus }: { focus: UserFocus }) {
  return (
    <>
      <p className='text-sm text-foreground'>{focus.focus_text}</p>
      {focus.deadline !== null && (
        <p className='text-xs text-muted-foreground mt-1'>
          {formatDeadline(focus.deadline)}
        </p>
      )}
    </>
  );
}

interface EditFormProps {
  focusText: string;
  deadline: string;
  isPending: boolean;
  onChangeFocusText: (v: string) => void;
  onChangeDeadline: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function EditForm({
  focusText,
  deadline,
  isPending,
  onChangeFocusText,
  onChangeDeadline,
  onSave,
  onCancel,
}: EditFormProps) {
  return (
    <div className='flex flex-col gap-3'>
      <textarea
        value={focusText}
        onChange={(e) => {
          return onChangeFocusText(e.target.value);
        }}
        maxLength={500}
        rows={2}
        placeholder='What are you focused on?'
        className='w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'
      />
      <div className='flex items-center gap-2'>
        <input
          type='date'
          value={deadline}
          onChange={(e) => {
            return onChangeDeadline(e.target.value);
          }}
          className='rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
        />
        <span className='text-xs text-muted-foreground'>
          deadline (optional)
        </span>
      </div>
      <div className='flex items-center gap-2'>
        <button
          onClick={onSave}
          disabled={isPending || focusText.trim().length === 0}
          className='rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors'
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          disabled={isPending}
          className='rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors'
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ReadonlyFocusBlock({ focus }: { focus: UserFocus }) {
  return (
    <div className='rounded-[var(--radius-card)] border border-primary/30 bg-primary/5 p-4'>
      <FocusHeader />
      <FocusText focus={focus} />
    </div>
  );
}

function useFocusActions(
  focusText: string,
  deadline: string,
  setFocus: (f: UserFocus | null) => void,
  setEditing: (v: boolean) => void,
) {
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const trimmed = focusText.trim();
    if (trimmed.length === 0) return;
    startTransition(async () => {
      const result = await setUserFocus({
        focus_text: trimmed,
        deadline: deadline.length > 0 ? deadline : null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setFocus({
        focus_text: trimmed,
        deadline: deadline || null,
        expires_at: null,
      });
      setEditing(false);
      toast.success('Focus saved');
    });
  }

  function handleClear() {
    startTransition(async () => {
      const result = await clearUserFocus();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setFocus(null);
      toast.success('Focus cleared');
    });
  }

  return { isPending, handleSave, handleClear };
}

interface FocusViewProps {
  focus: UserFocus | null;
  isPending: boolean;
  onEdit: (f: UserFocus | null) => void;
  onClear: () => void;
}

function FocusView({ focus, isPending, onEdit, onClear }: FocusViewProps) {
  if (focus?.focus_text) {
    return (
      <div className='flex flex-col gap-2'>
        <FocusText focus={focus} />
        <div className='flex items-center gap-2 mt-1'>
          <button
            onClick={() => {
              return onEdit(focus);
            }}
            className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'
          >
            <Pencil className='h-3 w-3' />
            Edit
          </button>
          <button
            onClick={onClear}
            disabled={isPending}
            className='flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50'
          >
            <X className='h-3 w-3' />
            {isPending ? 'Clearing…' : 'Clear'}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className='flex flex-col gap-2'>
      <p className='text-xs text-muted-foreground'>No active focus set</p>
      <button
        onClick={() => {
          return onEdit(null);
        }}
        className='self-start rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors'
      >
        Set focus
      </button>
    </div>
  );
}

function EditableFocusBlock({
  initialFocus,
}: {
  initialFocus: UserFocus | null;
}) {
  const [focus, setFocus] = useState<UserFocus | null>(initialFocus);
  const [editing, setEditing] = useState(false);
  const [focusText, setFocusText] = useState('');
  const [deadline, setDeadline] = useState('');
  const { isPending, handleSave, handleClear } = useFocusActions(
    focusText,
    deadline,
    setFocus,
    setEditing,
  );

  function openForm(prefill: UserFocus | null) {
    setFocusText(prefill?.focus_text ?? '');
    setDeadline(prefill?.deadline ?? '');
    setEditing(true);
  }

  return (
    <div
      className={`rounded-[var(--radius-card)] border p-4 transition-colors ${
        focus?.focus_text
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-card'
      }`}
    >
      <FocusHeader />
      {editing ? (
        <EditForm
          focusText={focusText}
          deadline={deadline}
          isPending={isPending}
          onChangeFocusText={setFocusText}
          onChangeDeadline={setDeadline}
          onSave={handleSave}
          onCancel={() => {
            return setEditing(false);
          }}
        />
      ) : (
        <FocusView
          focus={focus}
          isPending={isPending}
          onEdit={openForm}
          onClear={handleClear}
        />
      )}
    </div>
  );
}

export function FocusBlock({
  initialFocus,
  readonly = false,
}: {
  initialFocus: UserFocus | null;
  readonly?: boolean;
}) {
  if (readonly) {
    return initialFocus?.focus_text ? (
      <ReadonlyFocusBlock focus={initialFocus} />
    ) : null;
  }
  return <EditableFocusBlock initialFocus={initialFocus} />;
}
