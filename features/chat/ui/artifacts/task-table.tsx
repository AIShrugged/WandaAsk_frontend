import { format, parseISO, isValid } from 'date-fns';

import type { TaskTableArtifact } from '@/features/chat/types';

const COLUMN_LABELS: Record<string, string> = {
  task: 'Task',
  assignee: 'Assignee',
  due_date: 'Due date',
};

function formatCell(col: string, value: string): string {
  if (col === 'due_date' && value) {
    try {
      const date = parseISO(value);
      if (isValid(date)) return format(date, 'MMM d, yyyy');
    } catch { /* keep raw */ }
  }
  return value ?? '—';
}

export function TaskTable({ data }: { data: TaskTableArtifact['data'] }) {
  const columns = data.columns ?? [];
  const rows = data.rows ?? [];

  if (rows.length === 0) {
    return (
      <p className='text-sm text-muted-foreground text-center py-6'>No tasks yet</p>
    );
  }

  return (
    <div className='overflow-x-auto -mx-1'>
      <table className='w-full text-sm border-collapse'>
        <thead>
          <tr className='border-b border-border'>
            {columns.map(col => (
              <th
                key={col}
                className='text-left text-xs font-semibold text-muted-foreground py-2 px-3 whitespace-nowrap'
              >
                {COLUMN_LABELS[col] ?? col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className='border-b border-border/50 last:border-0 hover:bg-accent/40 transition-colors'
            >
              {columns.map(col => (
                <td key={col} className='py-2.5 px-3 text-foreground'>
                  {formatCell(col, row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
