'use client';

import { useRouter } from 'next/navigation';

import type { ReactNode } from 'react';

export function TabLink({
  tab,
  children,
}: {
  tab: string;
  children: ReactNode;
}) {
  const router = useRouter();

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
