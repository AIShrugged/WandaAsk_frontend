'use client';

import { TOUR_STEPS } from '../model/steps';

interface TourProgressProps {
  currentStepIndex: number;
}

/**
 * Returns the CSS class string for a progress dot based on its position.
 * @param index - The dot's position index.
 * @param currentStepIndex - The currently active step index.
 * @returns Tailwind class string for the dot.
 */
function getDotClass(index: number, currentStepIndex: number): string {
  if (index === currentStepIndex) {
    return 'w-4 h-2 bg-violet-500 rounded-full transition-all duration-200';
  }

  if (index < currentStepIndex) {
    return 'w-2 h-2 bg-violet-400/60 rounded-full transition-all duration-200';
  }

  return 'w-2 h-2 bg-border rounded-full transition-all duration-200';
}

/**
 * Returns the aria-label for a progress dot.
 * @param index - The dot's position index.
 * @param currentStepIndex - The currently active step index.
 * @returns Aria-label string.
 */
function getDotLabel(index: number, currentStepIndex: number): string {
  if (index === currentStepIndex) {
    return `Step ${index + 1} (current)`;
  }

  if (index < currentStepIndex) {
    return `Step ${index + 1} (completed)`;
  }

  return `Step ${index + 1}`;
}

/**
 * TourProgress component.
 * Renders dot indicators showing completed, active, and future steps.
 * @param root0 - Component props.
 * @param root0.currentStepIndex - Zero-based index of the currently active step.
 * @returns JSX element.
 */
export function TourProgress({ currentStepIndex }: TourProgressProps) {
  return (
    <div
      className='flex items-center gap-1.5'
      role='tablist'
      aria-label='Tour progress'
    >
      {TOUR_STEPS.map((step, index) => {
        return (
          <div
            key={step.id}
            role='tab'
            aria-selected={index === currentStepIndex}
            aria-label={getDotLabel(index, currentStepIndex)}
            className={getDotClass(index, currentStepIndex)}
          />
        );
      })}
    </div>
  );
}
