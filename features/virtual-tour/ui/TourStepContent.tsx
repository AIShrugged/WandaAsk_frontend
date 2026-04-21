'use client';

import type { TourStep } from '../model/types';

interface TourStepContentProps {
  step: TourStep;
}

/**
 * TourStepContent component.
 * Renders the illustration slot, title, and description for a tour step.
 * @param root0 - Component props.
 * @param root0.step - The current tour step data.
 * @returns JSX element.
 */
export function TourStepContent({ step }: TourStepContentProps) {
  return (
    <div>
      {step.illustration !== undefined && (
        <div className='mb-4 flex items-center justify-center'>
          {step.illustration}
        </div>
      )}
      <h2
        id='tour-step-title'
        className='text-lg font-semibold text-foreground'
      >
        {step.title}
      </h2>
      <p
        id='tour-step-description'
        className='text-sm text-muted-foreground mt-2'
      >
        {step.description}
      </p>
    </div>
  );
}
