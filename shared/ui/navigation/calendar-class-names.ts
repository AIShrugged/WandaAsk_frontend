export const CALENDAR_CLASS_NAMES = {
  root: 'w-full',
  months: 'flex flex-col',
  month: 'space-y-2',
  month_caption: 'flex items-center justify-between px-1 pb-1 relative h-9',
  caption_label:
    'text-sm font-semibold text-foreground absolute left-1/2 -translate-x-1/2',
  nav: 'flex items-center gap-1',
  button_previous:
    'flex h-7 w-7 items-center justify-center rounded-[var(--radius-button)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed',
  button_next:
    'flex h-7 w-7 items-center justify-center rounded-[var(--radius-button)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed',
  chevron: 'h-4 w-4',
  weekdays: 'flex',
  weekday: 'w-9 text-center text-xs font-medium text-muted-foreground',
  weeks: '',
  week: 'flex w-full mt-1',
  day: 'relative p-0',
  day_button: [
    'h-9 w-9 rounded-[var(--radius-button)] text-sm',
    'flex items-center justify-center',
    'transition-colors cursor-pointer text-foreground',
    'hover:bg-secondary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
  ].join(' '),
  selected: [
    'bg-primary text-primary-foreground font-medium',
    'hover:bg-primary/90',
    'ring-1 ring-primary-foreground/20 ring-inset',
  ].join(' '),
  today: 'ring-1 ring-primary/60 text-primary font-medium',
  outside: 'text-muted-foreground opacity-40',
  disabled: 'opacity-30 cursor-not-allowed pointer-events-none',
  hidden: 'invisible',
} as const;
