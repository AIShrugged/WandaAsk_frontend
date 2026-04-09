'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * ButtonBack component.
 */
export default function ButtonBack() {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        return router.back();
      }}
      className='cursor-pointer text-primary'
      aria-label='Back'
    >
      <ChevronLeft size={36} />
    </button>
  );
}
