import clsx from 'clsx';

const sizeClasses = {
  xs: 'w-3 h-3 border-2',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-4',
} as const;

interface SpinLoaderProps {
  size?: keyof typeof sizeClasses;
  className?: string;
}

export default function SpinLoader({
  size = 'lg',
  className,
}: SpinLoaderProps) {
  return (
    <div
      className={clsx(
        'border-primary border-t-transparent rounded-full animate-spin',
        sizeClasses[size],
        className,
      )}
    />
  );
}
