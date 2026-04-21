'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

import { TOUR_STEPS } from '../model/steps';
import { useTourStore } from '../model/tour-store';

import { TourControls } from './TourControls';
import { TourProgress } from './TourProgress';
import { TourSpotlight } from './TourSpotlight';
import { TourStepContent } from './TourStepContent';

/**
 * TourOverlay component.
 * Renders the full-screen backdrop and the tour card when the tour is open.
 * Uses AnimatePresence for step transition animations.
 * Handles keyboard navigation (Escape, ArrowLeft, ArrowRight) and focus trapping.
 * @returns JSX element.
 */
export function TourOverlay() {
  const { isOpen, currentStepIndex, close, goNext, goBack } = useTourStore();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Capture previous focus and restore on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      dialogRef.current?.focus();
    } else if (previousFocusRef.current !== null) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': {
          close();
          break;
        }
        case 'ArrowRight': {
          goNext();
          break;
        }
        case 'ArrowLeft': {
          goBack();
          break;
        }
        default: {
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close, goNext, goBack]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex];

  if (step === undefined) return null;

  return (
    <>
      {/* Spotlight for steps that define a selector */}
      {step.spotlightSelector !== undefined && (
        <TourSpotlight selector={step.spotlightSelector} />
      )}

      {/* Backdrop */}
      <div className='fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center'>
        {/* Screen reader live region for step announcements */}
        <span aria-live='polite' className='sr-only'>
          Step {currentStepIndex + 1} of {TOUR_STEPS.length}: {step.title}
        </span>

        {/* Tour card */}
        <div
          ref={dialogRef}
          role='dialog'
          aria-modal='true'
          aria-labelledby='tour-step-title'
          aria-describedby='tour-step-description'
          tabIndex={-1}
          className='bg-card border border-border rounded-[var(--radius-card)] shadow-card p-6 w-full max-w-[480px] mx-4 outline-none'
        >
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <TourStepContent step={step} />
            </motion.div>
          </AnimatePresence>

          <div className='mt-4'>
            <TourProgress currentStepIndex={currentStepIndex} />
          </div>

          <TourControls step={step} currentStepIndex={currentStepIndex} />
        </div>
      </div>
    </>
  );
}
