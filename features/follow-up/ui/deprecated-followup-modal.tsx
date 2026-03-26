'use client';

import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';
import ModalBody from '@/shared/ui/modal/modal-body';
import ModalFooter from '@/shared/ui/modal/modal-footer';
import ModalHeader from '@/shared/ui/modal/modal-header';
import { ModalRoot } from '@/shared/ui/modal/modal-root';

import { pollFollowUp, regenerateFollowUp } from '../api/follow-up';

const POLL_INTERVAL = 4000;

interface DeprecatedFollowUpModalProps {
  followUpId: number;
  isOpen?: boolean;
  title?: string;
}

type State = 'idle' | 'regenerating' | 'polling' | 'failed' | 'dismissed';

/**
 * DeprecatedFollowUpModal.
 * @param props - Component props.
 * @param props.followUpId
 * @param props.isOpen
 * @param props.title
 * @returns JSX element.
 */
export default function DeprecatedFollowUpModal({
  followUpId,
  isOpen = true,
  title = 'Follow-up uses an outdated methodology',
}: DeprecatedFollowUpModalProps) {
  const router = useRouter();
  const [state, setState] = useState<State>(isOpen ? 'idle' : 'dismissed');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const close = useCallback(() => {
    clearTimer();
    setState('dismissed');
  }, [clearTimer]);
  const startPolling = useCallback(
    (newId: number) => {
      /**
       *
       */
      const poll = async () => {
        try {
          const { data } = await pollFollowUp(newId);

          if (data.status === 'done') {
            clearTimer();
            router.refresh();
            close();

            return;
          }

          if (data.status === 'failed') {
            clearTimer();
            setState('failed');

            return;
          }

          timerRef.current = setTimeout(poll, POLL_INTERVAL);
        } catch {
          clearTimer();
          setState('failed');
        }
      };

      clearTimer();
      setState('polling');
      timerRef.current = setTimeout(poll, POLL_INTERVAL);
    },
    [clearTimer, close, router],
  );
  const handleRegenerate = useCallback(async () => {
    setState('regenerating');

    try {
      const { data } = await regenerateFollowUp(followUpId);

      if (data.status === 'done') {
        clearTimer();
        router.refresh();
        close();

        return;
      }

      if (data.status === 'failed') {
        clearTimer();
        setState('failed');

        return;
      }

      startPolling(data.id);
    } catch {
      clearTimer();
      setState('failed');
    }
  }, [clearTimer, close, followUpId, router, startPolling]);
  const handleRetry = useCallback(() => {
    void handleRegenerate();
  }, [handleRegenerate]);

  return (
    <ModalRoot open={state !== 'dismissed' && isOpen} onClose={close}>
      <ModalHeader onClick={close} title={title} />

      {(state === 'idle' || state === 'failed') && (
        <ModalBody>
          {state === 'idle' ? (
            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 mt-0.5'>
                  <AlertTriangle className='size-4 text-yellow-400' />
                </div>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-foreground'>
                    Created with outdated methodology
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    The team methodology has changed since this follow-up was
                    generated. You can regenerate it with the current
                    methodology or keep it as is.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/20 mt-0.5'>
                  <AlertTriangle className='size-4 text-destructive' />
                </div>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-foreground'>
                    Unable to update the report
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Please try regenerating the follow-up again.
                  </p>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
      )}

      {(state === 'regenerating' || state === 'polling') && (
        <ModalBody>
          <div className='flex flex-col items-center gap-3 text-center py-2'>
            <Loader2 className='size-8 animate-spin text-primary' />
            <div className='space-y-1'>
              <p className='text-sm font-medium text-foreground'>
                Generating a report with the new methodology...
              </p>
              <p className='text-xs text-muted-foreground'>
                This may take up to a minute
              </p>
            </div>
          </div>
        </ModalBody>
      )}

      <ModalFooter>
        <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
          {state === 'failed' ? (
            <Button type='button' onClick={handleRetry} className='w-auto'>
              Try again
            </Button>
          ) : (
            <>
              <Button
                type='button'
                onClick={handleRegenerate}
                className='w-auto'
                loading={state === 'regenerating' || state === 'polling'}
                loadingText='Generating...'
              >
                <RefreshCw className='size-4' />
                Regenerate with the new methodology
              </Button>
              <Button
                type='button'
                variant={BUTTON_VARIANT.secondary}
                onClick={close}
                className='w-auto'
              >
                Keep as is
              </Button>
            </>
          )}
        </div>
      </ModalFooter>
    </ModalRoot>
  );
}
