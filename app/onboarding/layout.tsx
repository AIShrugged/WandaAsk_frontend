import type { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className='min-h-screen w-full bg-[var(--background)] flex items-start justify-center'>
      <div className='w-full max-w-2xl px-4 py-12'>{children}</div>
    </div>
  );
}
