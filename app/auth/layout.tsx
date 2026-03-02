import type { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className='min-h-screen w-full flex justify-center items-center px-4 py-12 bg-muted'>
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          backgroundImage:
            'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.6,
        }}
      />
      <div className='relative z-10 w-full flex justify-center'>
        {children}
      </div>
    </div>
  );
}
