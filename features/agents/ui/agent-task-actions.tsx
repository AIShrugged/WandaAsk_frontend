'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  deleteAgentProfile,
  deleteAgentTask,
  dispatchAgentTask,
  updateAgentTask,
} from '@/features/agents/api/agents';
import { isAgentActionError } from '@/features/agents/model/types';
import { ROUTES } from '@/shared/lib/routes';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';

interface BaseProps {
  backHref: string;
}

/**
 *
 * @param root0
 * @param root0.id
 * @param root0.backHref
 */
export function AgentProfileActions({
  id,
  backHref,
}: BaseProps & { id: number }) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <div className='flex flex-wrap gap-3'>
      <Link
        href={backHref}
        className='inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] border border-input bg-background px-4 text-sm text-foreground hover:bg-accent w-full sm:w-auto'
      >
        Back to profiles
      </Link>
      <Button
        type='button'
        variant={BUTTON_VARIANT.danger}
        className='w-full sm:w-auto'
        loading={isPending}
        onClick={() => {
          if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);

            return;
          }

          startTransition(async () => {
            const result = await deleteAgentProfile(id);

            if (result.error) {
              toast.error(result.error);

              return;
            }

            toast.success('Agent profile deleted');
            router.push(backHref);
            router.refresh();
          });
        }}
      >
        {isConfirmingDelete ? 'Confirm delete' : 'Delete'}
      </Button>
      {isConfirmingDelete ? (
        <Button
          type='button'
          variant={BUTTON_VARIANT.secondary}
          className='w-full sm:w-auto'
          onClick={() => {
            setIsConfirmingDelete(false);
          }}
        >
          Cancel
        </Button>
      ) : null}
    </div>
  );
}

/**
 *
 * @param root0
 * @param root0.id
 * @param root0.enabled
 * @param root0.backHref
 */
export function AgentTaskActions({
  id,
  enabled,
  backHref,
}: BaseProps & {
  id: number;
  enabled: boolean;
}) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [isDeletePending, setIsDeletePending] = useState(false);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <div className='flex flex-wrap gap-3'>
      <Link
        href={`${ROUTES.DASHBOARD.AGENT_TASKS}/${id}?tab=config`}
        className='inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] border border-input bg-background px-4 text-sm text-foreground hover:bg-accent w-full sm:w-auto'
      >
        Edit
      </Link>
      <Button
        type='button'
        className='w-full sm:w-auto'
        loading={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await dispatchAgentTask(id);

            if (isAgentActionError(result)) {
              toast.error(result.error);

              return;
            }

            toast.success('Task dispatched');
            router.refresh();
          });
        }}
      >
        Run now
      </Button>
      <Button
        type='button'
        variant={BUTTON_VARIANT.secondary}
        className='w-full sm:w-auto'
        loading={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await updateAgentTask(id, { enabled: !enabled });

            if (isAgentActionError(result)) {
              toast.error(result.error);

              return;
            }

            toast.success(enabled ? 'Task disabled' : 'Task enabled');
            router.refresh();
          });
        }}
      >
        {enabled ? 'Disable' : 'Enable'}
      </Button>
      <Button
        type='button'
        variant={BUTTON_VARIANT.danger}
        className='w-full sm:w-auto'
        loading={isDeletePending}
        onClick={() => {
          if (!isConfirmingDelete) {
            setIsConfirmingDelete(true);

            return;
          }

          setIsDeletePending(true);
          deleteAgentTask(id)
            .then((result) => {
              if (result.error) {
                toast.error(result.error);

                return;
              }

              toast.success('Agent task deleted');
              router.push(backHref);
              router.refresh();
            })
            .finally(() => {
              setIsConfirmingDelete(false);
              setIsDeletePending(false);
            });
        }}
      >
        {isConfirmingDelete ? 'Confirm delete' : 'Delete'}
      </Button>
      {isConfirmingDelete ? (
        <Button
          type='button'
          variant={BUTTON_VARIANT.secondary}
          className='w-full sm:w-auto'
          onClick={() => {
            setIsConfirmingDelete(false);
          }}
        >
          Cancel
        </Button>
      ) : null}
    </div>
  );
}
