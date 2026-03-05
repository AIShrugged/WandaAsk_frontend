'use client';

import { useRouter } from 'next/navigation';

import type { ReactNode } from 'react';

/**
 * TabLink component.
 * @param root0
 * @param root0.tab
 * @param root0.children
 */
export function TabLink({
  tab,
  children,
}: {
  tab: string;
  children: ReactNode;
}) {
  const router = useRouter();

  /**
   * handleClick.
   * @param e - e.
   * @returns Result.
   */
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.replace(`?tab=${tab}`, { scroll: false });
  };

  return (
    <a href={`?tab=${tab}`} onClick={handleClick} className='cursor-pointer'>
      {children}
    </a>
  );
}
