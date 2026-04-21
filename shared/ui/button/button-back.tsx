'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ButtonBack({
  fallbackHref,
}: {
  fallbackHref?: string;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (fallbackHref && globalThis.history.length <= 1) {
          router.push(fallbackHref);
        } else {
          router.back();
        }
      }}
      className='cursor-pointer text-primary'
      aria-label='Back'
    >
      <ChevronLeft size={36} />
    </button>
  );
}
