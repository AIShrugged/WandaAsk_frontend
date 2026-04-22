'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

import { ButtonClose } from '@/shared/ui/button';

import { saveTourProgress } from '../api/tour';
import { TOUR_STEPS } from '../model/steps';
import { useTourStore } from '../model/tour-store';

import { TourControls } from './TourControls';
import { TourProgress } from './TourProgress';
import { TourStepContent } from './TourStepContent';
import { useTourSpotlight } from './use-tour-spotlight';

import type { Easing } from 'framer-motion';

const CARD_ANIMATION = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.2, ease: 'easeOut' as Easing },
};

/**
 * TourCard — the tour step card, shared between spotlight and plain modes.
 */
const TOUR_TOTAL = TOUR_STEPS.length;

function TourCard({
  dialogRef,
  currentStepIndex,
  step,
  onClose,
}: {
  dialogRef: React.RefObject<HTMLDivElement | null>;
  currentStepIndex: number;
  step: (typeof TOUR_STEPS)[number];
  onClose: () => void;
}) {
  return (
    <motion.div
      ref={dialogRef}
      role='dialog'
      aria-modal='true'
      aria-labelledby='tour-step-title'
      aria-describedby='tour-step-description'
      tabIndex={-1}
      className='bg-card border border-border rounded-[var(--radius-card)] p-6 w-full max-w-[480px] mx-4 outline-none'
      {...CARD_ANIMATION}
    >
      <div className='flex items-center justify-between mb-4'>
        <span className='text-xs text-muted-foreground'>
          Step {currentStepIndex + 1} of {TOUR_TOTAL}
        </span>
        <ButtonClose size={18} close={onClose} />
      </div>

      <AnimatePresence mode='wait'>
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <TourStepContent step={step} />
        </motion.div>
      </AnimatePresence>

      <div className='mt-4'>
        <TourProgress currentStepIndex={currentStepIndex} />
      </div>

      <TourControls step={step} currentStepIndex={currentStepIndex} />
    </motion.div>
  );
}

/**
 * TourOverlay — renders the full-screen backdrop and tour card.
 *
 * When the current step has a `spotlightSelector`, the backdrop is an SVG mask
 * that cuts out the target element (same z-level as the card, no layering conflict).
 * When there is no selector, uses the same pattern as ModalRoot: animated
 * bg-black/40 backdrop + scale animation on the card.
 */
export function TourOverlay() {
  const { isOpen, currentStepIndex, close, goNext, goBack } = useTourStore();

  const handleClose = () => {
    void saveTourProgress(currentStepIndex);
    close();
  };
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const step = TOUR_STEPS[currentStepIndex];
  const spotlightRect = useTourSpotlight(
    isOpen ? step?.spotlightSelector : undefined,
  );

  // Focus management
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

  if (!isOpen || step === undefined) return null;

  const liveRegion = (
    <span aria-live='polite' className='sr-only'>
      Step {currentStepIndex + 1} of {TOUR_STEPS.length}: {step.title}
    </span>
  );

  // Spotlight mode — SVG mask IS the backdrop (same z-level, no conflict)
  if (step.spotlightSelector !== undefined && spotlightRect !== null) {
    const { x, y, width, height } = spotlightRect;

    return (
      <>
        {liveRegion}

        {/* SVG backdrop with cutout — same z as the card */}
        <svg
          aria-hidden='true'
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 10_000,
            pointerEvents: 'none',
          }}
        >
          <defs>
            <mask id='tour-cutout'>
              <rect width='100%' height='100%' fill='white' />
              <rect
                x={x - 4}
                y={y - 4}
                width={width + 8}
                height={height + 8}
                rx={6}
                fill='black'
              />
            </mask>
          </defs>
          <rect
            width='100%'
            height='100%'
            fill='rgba(0,0,0,0.6)'
            mask='url(#tour-cutout)'
          />
        </svg>

        {/* Tour card — positioned above the SVG */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10_001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ pointerEvents: 'auto', width: '100%', maxWidth: 512 }}>
            <TourCard
              dialogRef={dialogRef}
              currentStepIndex={currentStepIndex}
              step={step}
              onClose={handleClose}
            />
          </div>
        </div>
      </>
    );
  }

  // Plain mode (no spotlight, or element not yet in DOM) — matches ModalRoot pattern
  return (
    <>
      {liveRegion}
      <motion.div
        className='fixed inset-0 z-[10000] flex items-center justify-center bg-black/40'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <TourCard
          dialogRef={dialogRef}
          currentStepIndex={currentStepIndex}
          step={step}
          onClose={handleClose}
        />
      </motion.div>
    </>
  );
}
