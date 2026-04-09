import { ApiRegistryTable } from '@/features/debug';

/**
 * Debug → API tab: registry of all backend routes with frontend caller mapping.
 */
export default function DebugApiPage() {
  return (
    <div className='h-full p-2'>
      <ApiRegistryTable />
    </div>
  );
}
