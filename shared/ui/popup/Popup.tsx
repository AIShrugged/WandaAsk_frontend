'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  type PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';

interface PopupPosition {
  top: number;
  left: number;
}

interface PopupProps extends PropsWithChildren {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  width?: number;
  offset?: number;
}

function calcPosition(
  anchor: HTMLElement,
  width: number,
  offset: number,
): PopupPosition {
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const top = rect.bottom + offset;
  let left = rect.left + rect.width / 2 - width / 2;

  if (left + width > vw) left = vw - width - offset;
  if (left < offset) left = offset;

  return { top, left };
}

function noop() {}

function noopSubscribe(_cb: () => void) {
  return noop;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function Popup({
  anchor,
  open,
  onClose,
  width = 240,
  offset = 8,
  children,
}: PopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    noopSubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const pos = useMemo<PopupPosition>(() => {
    if (open && anchor) return calcPosition(anchor, width, offset);
    return { top: 0, left: 0 };
  }, [open, anchor, width, offset]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handlePointer = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        anchor &&
        !anchor.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('pointerdown', handlePointer);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('pointerdown', handlePointer);
    };
  }, [open, onClose, anchor]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className='fixed z-50 rounded-[var(--radius-card)] border border-border bg-card shadow-lg'
          style={{ top: pos.top, left: pos.left, width }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
