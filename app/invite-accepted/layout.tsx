import React, { type PropsWithChildren } from 'react';

/**
 * Layout component.
 * @param props - Component props.
 * @param props.children
 */
export default async function Layout({ children }: PropsWithChildren) {
  return (
    <div className='bg-muted min-h-screen w-full flex flex-row'>
      <main className='flex flex-col items-center  flex-1 min-w-0 h-screen py-4 px-4'>
        {children}
      </main>
    </div>
  );
}
