'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Modal component.
 * @param onClose.isOpen
 * @param onClose - onClose.
 * @param onClose.onClose
 * @param title - title.
 * @param onClose.title
 * @param children - children.
 * @param onClose.children
 */
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    /**
     * handleEscape.
     * @param e - e.
     * @returns Result.
     */
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className='fixed inset-0 bg-black/40 backdrop-blur-sm z-40'
        />

        {/* Modal */}
        <div className='fixed inset-0 flex items-center justify-center z-50 p-4'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='bg-card rounded-[var(--radius-card)] border border-border shadow-card w-full max-w-md max-h-[90vh] overflow-hidden'
          >
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-border'>
              <h2 className='text-base font-semibold text-foreground'>
                {title}
              </h2>
              <button
                onClick={onClose}
                className='cursor-pointer p-1.5 hover:bg-accent rounded-md transition-colors'
                aria-label='Close modal'
              >
                <X className='w-4 h-4 text-muted-foreground' />
              </button>
            </div>

            {/* Content */}
            <div className='px-6 py-4 overflow-y-auto max-h-[calc(90vh-80px)]'>
              {children}
            </div>
          </motion.div>
        </div>
      </>
    )
  );
}
