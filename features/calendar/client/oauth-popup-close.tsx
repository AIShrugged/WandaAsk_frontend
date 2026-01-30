'use client';

import { useEffect } from 'react';

export default function OAuthPopupClose() {
  useEffect(() => {
    const channel = new BroadcastChannel('calendar_oauth');
    channel.postMessage({ type: 'CALENDAR_CONNECTED', success: true });
    channel.close();
    globalThis.close();
  }, []);

  return (
    <p className='p-8 text-center text-sm text-muted-foreground'>
      Calendar connected! This window will close automatically.
    </p>
  );
}
