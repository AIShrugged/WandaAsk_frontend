import { clsx } from 'clsx';

import Card from '@/shared/ui/card/Card';

import type { PropsWithChildren } from 'react';

/**
 * Standard full-height page container for standalone dashboard pages.
 *
 * Use in page.tsx files that own their own Card wrapper (not in sub-pages
 * whose parent layout already provides a Card).
 *
 * The `className` prop is ADDITIVE — do not pass layout overrides
 * (flex-row, h-auto, items-*) as they conflict with the enforced flex-col layout.
 * For overflow control, passing `overflow-y-auto` or `overflow-hidden` is valid.
 */
interface Props extends PropsWithChildren {
  className?: string;
}

export function PageContainer({ children, className }: Props) {
  return (
    <Card className={clsx('h-full flex flex-col', className)}>{children}</Card>
  );
}
