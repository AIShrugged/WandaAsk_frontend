import { notFound } from 'next/navigation';

import { DebugLogsViewer } from '@/features/debug-logs/ui/DebugLogsViewer';
import { isDev } from '@/shared/lib/logger';

/**
 *
 */
export default function DebugLogsPage() {
  if (!isDev) notFound();

  return (
    <div className='h-full p-2'>
      <DebugLogsViewer />
    </div>
  );
}