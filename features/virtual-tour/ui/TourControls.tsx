'use client';

import { Button } from '@/shared/ui/button';

import { markTourComplete } from '../api/tour';
import { useTourStore } from '../model/tour-store';

import type { TourStep } from '../model/types';

interface TourControlsProps {
  step: TourStep;
  currentStepIndex: number;
}

const TOUR_COMPLETED_KEY = 'tour_completed';
const TOUR_STEP_KEY = 'tour_step';

function clearTourStorage() {
  try {
    globalThis.localStorage.removeItem(TOUR_STEP_KEY);
    globalThis.localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
  } catch {
    // localStorage not available — ignore
  }
}

export function TourControls({ step, currentStepIndex }: TourControlsProps) {
  const { goNext, goBack, complete } = useTourStore();

  const handleCompleteAndClose = () => {
    void markTourComplete();
    clearTourStorage();
    complete();
  };

  const handleBack = () => {
    goBack();
  };

  const handleNext = () => {
    goNext();
  };

  return (
    <div className='mt-6'>
      <div className='flex gap-2'>
        <Button
          className='flex-1'
          variant='secondary'
          size='sm'
          disabled={currentStepIndex === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          className='flex-1'
          variant='secondary'
          size='sm'
          onClick={handleCompleteAndClose}
        >
          Skip
        </Button>

        <Button
          variant='primary'
          size='sm'
          onClick={step.isLast === true ? handleCompleteAndClose : handleNext}
        >
          {step.isLast === true ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
