import clsx from 'clsx';

import type { PropsWithChildren } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
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
        'flex items-center shrink-0 justify-center rounded-full bg-primary text-primary-foreground capitalize font-medium',
        sizeClasses[size],
        className,
      )}
      role={'img'}
    >
      {children}
    </div>
  );
}
