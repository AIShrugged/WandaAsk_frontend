import type { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div
      className={
        'bg-gradient-primary min-h-screen w-full flex justify-center items-center px-4 py-8'
      }
    >
      {children}
    </div>
  );
}
