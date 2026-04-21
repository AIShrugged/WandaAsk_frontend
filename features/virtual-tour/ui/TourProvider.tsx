'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { saveTourProgress } from '../api/tour';
import { TOUR_STEPS } from '../model/steps';
import { useTourStore } from '../model/tour-store';

const TOUR_COMPLETED_KEY = 'tour_completed';
const TOUR_STEP_KEY = 'tour_step';
const SAVE_DEBOUNCE_MS = 600;

interface TourProviderProps {
  children: React.ReactNode;
}

/**
 * TourProvider component.
 * Reads onboarding state from localStorage and auto-launches the tour if not completed.
 * Handles route navigation on step change and debounced progress saving.
 * @param root0 - Component props.
 * @param root0.children - Child components to render.
 * @returns JSX element.
 */
export function TourProvider({ children }: TourProviderProps) {
  const { open, isOpen, currentStepIndex } = useTourStore();
  const router = useRouter();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-launch on mount — reads from localStorage (localStorage shim until backend is ready)
  useEffect(() => {
    try {
      const completed = globalThis.localStorage.getItem(TOUR_COMPLETED_KEY);

      if (completed === 'true') return;

      const savedStep = globalThis.localStorage.getItem(TOUR_STEP_KEY);
      const startIndex = savedStep === null ? 0 : Number(savedStep);

      open(startIndex);
    } catch {
      // localStorage not available (SSR or private mode) — do not launch
    }
    // open is a stable zustand action — safe to omit from deps
  }, []);

  // Navigate to step route on step change
  useEffect(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStepIndex];

    if (step?.route !== undefined) {
      router.replace(step.route);
    }
  }, [currentStepIndex, isOpen, router]);

  // Debounced progress save — fire-and-forget, non-blocking
  useEffect(() => {
    if (!isOpen) return;

    // Save to localStorage immediately
    try {
      globalThis.localStorage.setItem(TOUR_STEP_KEY, String(currentStepIndex));
    } catch {
      // localStorage not available — ignore
    }

    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      void saveTourProgress(currentStepIndex);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [currentStepIndex, isOpen]);

  return <>{children}</>;
}
