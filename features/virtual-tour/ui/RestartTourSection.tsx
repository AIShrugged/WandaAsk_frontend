'use client';

import { Button } from '@/shared/ui/button';

import { resetTour } from '../api/tour';
import { useTourStore } from '../model/tour-store';

const TOUR_COMPLETED_KEY = 'tour_completed';
const TOUR_STEP_KEY = 'tour_step';

/**
 * Clears localStorage tour state and opens the tour from step 0.
 */
function handleRestart() {
  // Clear localStorage state
  try {
    globalThis.localStorage.removeItem(TOUR_COMPLETED_KEY);
    globalThis.localStorage.removeItem(TOUR_STEP_KEY);
  } catch {
    // localStorage not available — ignore
  }

  // Fire-and-forget backend reset
  void resetTour();

  // Open tour from the beginning
  useTourStore.getState().open(0);
}

/**
 * RestartTourSection component.
 * Renders a card section on the profile page with a button to restart the onboarding tour.
 * Clears localStorage state, fires reset on the backend (fire-and-forget), and opens the tour.
 * @returns JSX element.
 */
export function RestartTourSection() {
  return (
    <div className='bg-card border border-border rounded-[var(--radius-card)] shadow-card p-6 mt-6'>
      <h3 className='text-base font-semibold text-foreground'>
        Onboarding Tour
      </h3>
      <p className='text-sm text-muted-foreground mt-1 mb-4'>
        Restart the guided tour to revisit all core features of WandaAsk at any
        time.
      </p>
      <Button
        variant='secondary'
        size='sm'
        onClick={handleRestart}
        className='w-auto'
      >
        Restart Tour
      </Button>
    </div>
  );
}
