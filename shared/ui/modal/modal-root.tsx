'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  type PropsWithChildren,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-[480px]',
  lg: 'max-w-3xl',
} as const;

interface ModalRootProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  size?: keyof typeof sizeClasses;
  /** Matches aria-labelledby — provide if you render ModalHeader with a title */
  titleId?: string;
}

const noopUnsubscribe = () => {};
const noopSubscribe = () => {
  return noopUnsubscribe;
};

export function ModalRoot({
  open,
  onClose,
  size = 'md',
  titleId,
  children,
}: ModalRootProps) {
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => {
      return true;
    },
    () => {
      return false;
    },
  );

  const dialogRef = useRef<HTMLDivElement>(null);
  const autoTitleId = useId();
  const resolvedTitleId = titleId ?? autoTitleId;

  // Scroll lock + Escape handler
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Minimal focus trap — cycle Tab within the dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = [
          ...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        ];
        if (focusable.length === 0) return;

        const first = focusable[0];

        const last = focusable.at(-1)!;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Move focus into modal on open
  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const firstFocusable =
      dialogRef.current.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role='dialog'
            aria-modal='true'
            aria-labelledby={resolvedTitleId}
            className={`bg-card rounded-[var(--radius-card)] w-full ${sizeClasses[size]} mx-4 shadow-[inset_0_0_0_1px_var(--border),var(--shadow-xl)]`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => {
              return e.stopPropagation();
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
