'use client';

import {
  Bot,
  Check,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ROUTES } from '@/shared/lib/routes';

import { executeAiAction } from '../api/ai-action';
import { dispatchTaskToAgent } from '../api/dispatch';
import { sendDirectMessage } from '../api/send-message';

import type { CarriedTask, MeetingTask, TodayEvent } from '../model/types';

interface AiAction {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
  type: 'agent' | 'message';
  recipientUserId?: number;
  messageText?: string;
}

interface AiPrepPanelProps {
  event: TodayEvent;
  tasks: MeetingTask[];
  carriedTasks: CarriedTask[];
}

function buildSuggestions(
  event: TodayEvent,
  carriedTasks: CarriedTask[],
): AiAction[] {
  const actions: AiAction[] = [];

  // 1. Send follow-up — if meeting has summary
  if (event.summary) {
    const keyPoints = event.summary.key_points
      .map((p) => {
        return `- ${p}`;
      })
      .join('\n');
    const decisions =
      event.summary.decisions
        .map((d) => {
          return `- ${d}`;
        })
        .join('\n') || 'No decisions';
    actions.push({
      key: 'followup',
      icon: <Mail className='h-4 w-4' />,
      title: `Send follow-up from ${event.title}`,
      description: 'Draft recap with decisions and action items for the team',
      type: 'agent',
      prompt: `Draft a recap for meeting "${event.title}" based on the following data and send it to the team in Telegram.\n\nSummary: ${event.summary.summary}\n\nKey points:\n${keyPoints}\n\nDecisions:\n${decisions}`,
    });
  }

  // 2. Message assignee about stale task — direct Telegram message
  const staleCarried = carriedTasks
    .filter((t) => {
      return t.syncs_since_created >= 3 && t.assignee_name && t.assignee_id;
    })
    .slice(0, 2);

  for (const task of staleCarried) {
    actions.push({
      key: `msg-${task.id}`,
      icon: <MessageSquare className='h-4 w-4' />,
      title: `Message ${task.assignee_name} about ${task.name}`,
      description: `${task.syncs_since_created} syncs without progress — send a direct Telegram message`,
      type: 'message',
      prompt: '',
      recipientUserId: task.assignee_id!,
      messageText: `Hi! Task "${task.name}" has had no progress for ${task.syncs_since_created} syncs. Do you need help? When can we expect a result?`,
    });
  }

  // 3. Prepare status summary — always available
  actions.push({
    key: 'status',
    icon: <FileText className='h-4 w-4' />,
    title: 'Prepare status summary',
    description: 'Per-person progress across recent syncs for quick reference',
    type: 'agent',
    prompt: `Prepare a brief status summary of the team's tasks based on the meeting "${event.title}". Show progress per participant: tasks in progress, completed, and blocked. Format: name → task status.`,
  });

  return actions;
}

export function AiPrepPanel({ event, tasks, carriedTasks }: AiPrepPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());
  const router = useRouter();

  const dispatchable = tasks.filter((t) => {
    return t.status !== 'done';
  });
  const suggestions = useMemo(() => {
    return buildSuggestions(event, carriedTasks);
  }, [event, carriedTasks]);

  async function handleDispatchTask(taskId: number) {
    const key = `task-${taskId}`;
    setLoadingKey(key);
    const result = await dispatchTaskToAgent(taskId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Task dispatched to agent');
      setDoneKeys((prev) => {
        return new Set(prev).add(key);
      });
      router.refresh();
    }
    setLoadingKey(null);
  }

  async function handleAiAction(action: AiAction) {
    setLoadingKey(action.key);

    if (
      action.type === 'message' &&
      action.recipientUserId &&
      action.messageText
    ) {
      const result = await sendDirectMessage(
        action.recipientUserId,
        action.messageText,
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Message sent via Telegram');
        setDoneKeys((prev) => {
          return new Set(prev).add(action.key);
        });
      }
    } else {
      const result = await executeAiAction(action.title, action.prompt);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`"${action.title}" dispatched to agent`);
        setDoneKeys((prev) => {
          return new Set(prev).add(action.key);
        });
        router.refresh();
      }
    }

    setLoadingKey(null);
  }

  const hasItems = suggestions.length > 0 || dispatchable.length > 0;

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => {
            return setExpanded(!expanded);
          }}
          className='flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer'
        >
          <Bot className='h-4 w-4 text-primary' />
          AI prep
        </button>
        <Link
          href='/dashboard/issues/create'
          className='flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer'
        >
          <Plus className='h-4 w-4 text-primary' />
          Create task
        </Link>
      </div>

      {expanded && hasItems && (
        <div className='rounded-lg border border-border bg-card/50 p-3'>
          <p className='text-xs font-medium text-muted-foreground mb-3'>
            AI can do for this meeting
          </p>

          <div className='flex flex-col gap-2'>
            {/* Contextual AI suggestions */}
            {suggestions.map((action) => {
              const isDone = doneKeys.has(action.key);
              const isLoading = loadingKey === action.key;

              return (
                <div
                  key={action.key}
                  className='flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors'
                >
                  <span className='mt-0.5 text-primary shrink-0'>
                    {action.icon}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium text-foreground'>
                      {action.title}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {action.description}
                    </p>
                  </div>
                  {isDone ? (
                    <span className='shrink-0 text-xs text-emerald-500 flex items-center gap-1 mt-0.5'>
                      <Check className='h-3 w-3' />
                      Done
                    </span>
                  ) : (
                    <button
                      type='button'
                      disabled={loadingKey !== null}
                      onClick={() => {
                        return handleAiAction(action);
                      }}
                      className='shrink-0 text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1 mt-0.5 cursor-pointer disabled:cursor-wait'
                    >
                      {isLoading ? (
                        <Loader2 className='h-3 w-3 animate-spin' />
                      ) : (
                        'Go →'
                      )}
                    </button>
                  )}
                </div>
              );
            })}

            {/* Existing task dispatch */}
            {dispatchable.length > 0 && (
              <>
                {suggestions.length > 0 && (
                  <div className='border-t border-border my-1' />
                )}
                <p className='text-xs font-medium text-muted-foreground mt-1 mb-1'>
                  Dispatch tasks to agent
                </p>
                {dispatchable.map((task) => {
                  const key = `task-${task.id}`;
                  const isDone = doneKeys.has(key);
                  const isLoading = loadingKey === key;

                  return (
                    <div
                      key={task.id}
                      className='flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors'
                    >
                      <Bot className='h-3.5 w-3.5 text-primary shrink-0' />
                      <Link
                        href={`${ROUTES.DASHBOARD.ISSUES}/${task.id}`}
                        className='flex-1 text-sm text-foreground truncate hover:text-primary hover:underline transition-colors'
                      >
                        {task.name}
                      </Link>
                      {isDone ? (
                        <span className='shrink-0 text-xs text-emerald-500 flex items-center gap-1'>
                          <Check className='h-3 w-3' />
                          Dispatched
                        </span>
                      ) : (
                        <button
                          type='button'
                          disabled={loadingKey !== null}
                          onClick={() => {
                            return handleDispatchTask(task.id);
                          }}
                          className='shrink-0 text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1 cursor-pointer disabled:cursor-wait'
                        >
                          {isLoading ? (
                            <Loader2 className='h-3 w-3 animate-spin' />
                          ) : (
                            'Dispatch'
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
