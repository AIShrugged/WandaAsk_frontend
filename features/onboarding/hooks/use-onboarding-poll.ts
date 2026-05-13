'use client';

import { useEffect, useRef } from 'react';

import type { OnboardingDraftResponse } from '../model/types';

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 180;

function isDone(draft: OnboardingDraftResponse): boolean {
  return draft.status === 'completed' || draft.status === 'failed';
}

async function fetchDraft(
  orgId: number,
): Promise<OnboardingDraftResponse | null> {
  const res = await fetch(`/api/onboarding/draft?orgId=${orgId}`);
  if (!res.ok) return null;
  const data: { status: string } = await res.json();
  if (data.status === 'not_found') return null;
  return data as OnboardingDraftResponse;
}

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

    let active = true;
    stoppedRef.current = false;
    attemptsRef.current = 0;

    async function poll() {
      if (!active || stoppedRef.current) return;

      if (attemptsRef.current >= POLL_MAX_ATTEMPTS) {
        stoppedRef.current = true;
        onTimeoutRef.current();
        return;
      }

      attemptsRef.current++;

      try {
        const draft = await fetchDraft(orgId);
        if (!active || stoppedRef.current) return;

        if (draft !== null) {
          onResultRef.current(draft);
          if (isDone(draft)) return;
        }
      } catch {
        // Network error — keep polling
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    }

    setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      active = false;
      stoppedRef.current = true;
    };
  }, [orgId, enabled]);
}
