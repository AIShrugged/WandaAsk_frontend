import clsx from 'clsx';

import type { PropsWithChildren } from 'react';

const variants = {
  default: 'bg-secondary text-secondary-foreground',
  // text-violet-300: contrast ~9.5:1 on primary/10 dark card bg (was text-primary: 2.74:1)
  primary: 'bg-primary/10 text-violet-300',
  // success/warning: swapped to dark-theme-compatible colors (green-50/yellow-50 are light bg, wrong theme)
  // text-emerald-400: contrast 4.62:1 on accent/15 dark bg (was text-green-700 on green-50: wrong theme)
  success: 'bg-accent/15 text-emerald-400',
  warning: 'bg-yellow-500/15 text-yellow-300',
  // text-destructive now passes 4.5:1 on destructive/10 dark bg after darkening --destructive to 49% L
  // but destructive/10 bg with L=49% still gives ~3.3:1 — use brighter red text instead
  destructive: 'bg-destructive/10 text-red-400',
};

type BadgeProps = PropsWithChildren<{
  variant?: keyof typeof variants;
  className?: string;
}>;

/**
 * Badge component.
 * @param children.variant
 * @param children - children.
 * @param children.children
 * @param className - className.
 * @param children.className
 */
export function Badge({
  variant = 'default',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
