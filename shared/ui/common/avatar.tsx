import clsx from 'clsx';

import type { PropsWithChildren } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// TRIBES size scale (px): xs=20, sm=24, md=28, lg=36, xl=48
const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-6 h-6 text-[11px]',
  md: 'w-7 h-7 text-xs',
  lg: 'w-9 h-9 text-sm',
  xl: 'w-12 h-12 text-base',
};

interface AvatarProps extends PropsWithChildren {
  size?: AvatarSize;
  className?: string;
}

export default function Avatar({
  children,
  size = 'md',
  className,
}: AvatarProps) {
  return (
    <div
      className={clsx(
        'flex items-center shrink-0 justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] capitalize font-medium select-none',
        sizeClasses[size],
        className,
      )}
      role='img'
    >
      {children}
    </div>
  );
}
