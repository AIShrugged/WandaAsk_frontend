'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ButtonBackProps {
  /** Explicit navigation destination. When provided, always navigates here. */
  href?: string;
  /** Fallback href used only when there is no browser history (direct URL entry). */
  fallbackHref?: string;
}

export default function ButtonBack({ href, fallbackHref }: ButtonBackProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (href) {
          router.push(href);
          return;
        }
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
