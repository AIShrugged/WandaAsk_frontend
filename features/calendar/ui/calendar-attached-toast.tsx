'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * CalendarAttachedToast — fires a success toast once when Google Calendar
 * has just been connected (detected via the ?attached=1 query param).
 * Strips the ?attached=1 param from the URL after firing to prevent re-firing.
 * @returns null
 */
export default function CalendarAttachedToast() {
  const router = useRouter();

  useEffect(() => {
    toast.success('Google Calendar connected successfully!');

    const url = new URL(globalThis.location.href);

    url.searchParams.delete('attached');
    router.replace(url.pathname + (url.search || ''));
  }, [router]);

  return null;
}
