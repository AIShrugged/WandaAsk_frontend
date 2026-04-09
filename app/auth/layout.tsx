import { CosmicBackground } from '@/shared/ui/layout/cosmic-background';

import type { PropsWithChildren } from 'react';

/**
 * Layout component.
 * @param props - Component props.
 * @param props.children
 */
export default function Layout({ children }: PropsWithChildren) {
  return (
    <div
      className='min-h-screen w-full flex justify-center items-center px-4 py-12'
      style={{ background: 'hsl(240 40% 2%)' }}
    >
      <CosmicBackground />
      <div className='relative z-10 w-full flex justify-center'>{children}</div>
    </div>
  );
}
