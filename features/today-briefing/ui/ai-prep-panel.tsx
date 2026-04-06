'use client';

import { Bot, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { dispatchTaskToAgent } from '../api/dispatch';

import type { MeetingTask } from '../model/types';

interface AiPrepPanelProps {
  tasks: MeetingTask[];
}

export function AiPrepPanel({ tasks }: AiPrepPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<number | null>(null);
  const router = useRouter();

  const dispatchable = tasks.filter((t) => t.status !== 'done');

  if (dispatchable.length === 0) return null;

  async function handleDispatch(taskId: number) {
    setDispatchingId(taskId);
    const result = await dispatchTaskToAgent(taskId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Task dispatched to agent');
      router.refresh();
    }
    setDispatchingId(null);
  }

  return (
    <div className='flex flex-col gap-2'>
      <button
        type='button'
        onClick={() => setExpanded(!expanded)}
        className='flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors w-fit'
      >
        <Bot className='h-4 w-4 text-primary' />
        AI prep
      </button>

      {expanded && (
        <div className='rounded-lg border border-border bg-card/50 p-3'>
          <p className='text-xs font-medium text-muted-foreground mb-2'>
            Dispatch tasks to AI agent
          </p>
          <div className='flex flex-col gap-1.5'>
            {dispatchable.map((task) => (
              <div
                key={task.id}
                className='flex items-center gap-2 rounded-md px-2 py-1.5'
              >
                <Bot className='h-3.5 w-3.5 text-primary shrink-0' />
                <span className='flex-1 text-sm text-foreground truncate'>
                  {task.name}
                </span>
                <button
                  type='button'
                  disabled={dispatchingId !== null}
                  onClick={() => handleDispatch(task.id)}
                  className='shrink-0 text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1'
                >
                  {dispatchingId === task.id ? (
                    <Loader2 className='h-3 w-3 animate-spin' />
                  ) : (
                    'Dispatch'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
