'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { type PropsWithChildren, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

interface ModalRootProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
}

/** Noop unsubscribe for useSyncExternalStore. */
const noopUnsubscribe = () => {};
/**
 * Stable subscribe for useSyncExternalStore — no external store to listen to.
 * @returns Unsubscribe noop.
 */
const noopSubscribe = () => {
  return noopUnsubscribe;
};

/**
 * ModalRoot component.
 * @param props - Component props.
 * @param props.open - Whether the modal is open.
 * @param props.onClose - Callback invoked when the modal should close.
 * @param props.children - Modal content.
 * @returns React portal mounted to document.body, or null on the server.
 */
export function ModalRoot({ open, onClose, children }: ModalRootProps) {
  // useSyncExternalStore: server snapshot = false (no portal during SSR),
  // client snapshot = true — avoids setState-in-effect linter warning.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => {
      return true;
    },
    () => {
      return false;
    },
  );

  useEffect(() => {
    if (!open) return;

    /**
     * handleKeyDown.
     * @param e - e.
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className='bg-card border border-border rounded-[var(--radius-card)] w-full max-w-[700px] mx-4 shadow-card'
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => {
              e.stopPropagation();
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
