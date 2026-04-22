import type { PropsWithChildren } from 'react';

/**
 * Layout component.
 * @param props - Component props.
 * @param props.children
 */
export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className='min-h-screen w-full flex justify-center items-center px-4 py-12 bg-background'>
      <div className='relative z-10 w-full flex justify-center'>{children}</div>
    </div>
  );
}
