import { TasksTabsNav } from '@/features/tasks';

interface TasksLayoutProps {
  children: React.ReactNode;
}

/**
 * TasksLayout — wraps all /dashboard/tasks sub-pages with a shared tab navigation.
 */
export default function TasksLayout({ children }: TasksLayoutProps) {
  return (
    <div className='flex flex-col h-full overflow-hidden'>
      <div className='shrink-0 pt-4'>
        <TasksTabsNav />
      </div>
      <div className='flex-1 overflow-hidden'>{children}</div>
    </div>
  );
}