'use client';

import { useEffect, useRef } from 'react';

import type { OnboardingDraftResponse } from '../model/types';

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 180;

export function useOnboardingPoll(
  orgId: number,
  enabled: boolean,
  onResult: (draft: OnboardingDraftResponse) => void,
  onTimeout: () => void,
) {
  const stoppedRef = useRef(false);
  const attemptsRef = useRef(0);
  const onResultRef = useRef(onResult);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled) return;

    stoppedRef.current = false;
    attemptsRef.current = 0;

    async function poll() {
      if (stoppedRef.current) return;

      if (attemptsRef.current >= POLL_MAX_ATTEMPTS) {
        onTimeoutRef.current();
        return;
      }

      attemptsRef.current++;

      try {
        const res = await fetch(`/api/onboarding/draft?orgId=${orgId}`);

        if (res.ok) {
          const data: { status: string } = await res.json();

          if (data.status === 'not_found') {
            // Draft not created yet — keep polling
          } else {
            const draft = data as OnboardingDraftResponse;

            onResultRef.current(draft);

            if (draft.status === 'completed' || draft.status === 'failed')
              return;
          }
        } else {
          // Non-200: keep polling, backend may be temporarily unavailable
        }
      } catch {
        // Network error — keep polling
      }

      if (!stoppedRef.current) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      stoppedRef.current = true;
    };
  }, [orgId, enabled]);
}
