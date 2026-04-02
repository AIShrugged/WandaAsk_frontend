import { DebugLogsViewer } from '@/features/debug';

/**
 * Debug → Logs tab: live HTTP request log viewer.
 */
export default function DebugLogsPage() {
  return (
    <div className='h-full p-2'>
      <DebugLogsViewer />
    </div>
  );
}
