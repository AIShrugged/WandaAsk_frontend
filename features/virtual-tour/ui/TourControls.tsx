'use client';

import { attachCalendar } from '@/features/calendar/api/calendar';
import { Button, ButtonClose } from '@/shared/ui/button';

import { markTourComplete, saveTourProgress } from '../api/tour';
import { TOUR_STEPS } from '../model/steps';
import { useTourStore } from '../model/tour-store';

import type { TourStep } from '../model/types';

interface TourControlsProps {
  step: TourStep;
  currentStepIndex: number;
}

const TOUR_COMPLETED_KEY = 'tour_completed';
const TOUR_STEP_KEY = 'tour_step';
const TOUR_TOTAL = TOUR_STEPS.length;

/**
 * Clears tour localStorage keys and sets completed flag.
 */
function clearTourStorage() {
  try {
    globalThis.localStorage.removeItem(TOUR_STEP_KEY);
    globalThis.localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
  } catch {
    // localStorage not available — ignore
  }
}

/**
 * TourControls component.
 * Renders the step counter, close button, and navigation buttons (Back/Next/Skip).
 * The last step shows OAuth CTA instead of Next.
 * @param root0 - Component props.
 * @param root0.step - The current tour step data.
 * @param root0.currentStepIndex - Zero-based index of the current step.
 * @returns JSX element.
 */
export function TourControls({ step, currentStepIndex }: TourControlsProps) {
  const { close, goNext, goBack, complete } = useTourStore();

  const handleClose = () => {
    void saveTourProgress(currentStepIndex);
    close();
  };

  const handleSkip = () => {
    void markTourComplete();
    clearTourStorage();
    complete();
  };

  const handleConnectCalendar = async () => {
    try {
      await saveTourProgress(currentStepIndex);
      const oauthUrl = await attachCalendar();
      globalThis.location.href = oauthUrl;
    } catch {
      // Errors from attachCalendar surface via toast in the calendar feature
    }
  };

  const handleBack = () => {
    goBack();
  };

  const handleNext = () => {
    goNext();
  };

  return (
    <div className='mt-6 space-y-3'>
      {/* Header row: step counter + close button */}
      <div className='flex items-center justify-between'>
        <span className='text-xs text-muted-foreground'>
          Step {currentStepIndex + 1} of {TOUR_TOTAL}
        </span>
        <ButtonClose size={18} close={handleClose} />
      </div>

      {/* Navigation row */}
      {step.isLast === true ? (
        <div className='flex gap-2'>
          <Button
            variant='secondary'
            size='sm'
            className='flex-1'
            onClick={handleSkip}
          >
            Skip for now
          </Button>
          <Button
            variant='primary'
            size='sm'
            className='flex-1'
            onClick={() => {
              void handleConnectCalendar();
            }}
          >
            Connect Google Calendar
          </Button>
        </div>
      ) : (
        <div className='flex gap-2'>
          <Button
            variant='secondary'
            size='sm'
            className='flex-1'
            onClick={handleSkip}
          >
            Skip
          </Button>
          <Button
            variant='secondary'
            size='sm'
            disabled={currentStepIndex === 0}
            onClick={handleBack}
          >
            ← Back
          </Button>
          <Button
            variant='primary'
            size='sm'
            className='flex-1'
            onClick={handleNext}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
