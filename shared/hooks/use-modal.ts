'use client';

import { useContext } from 'react';

import { ModalContext } from '@/shared/ui/modal/modal-context';

/**
 * useModal hook.
 */
export function useModal() {
  const ctx = useContext(ModalContext);

  if (!ctx) {
    throw new Error('useModal must be used inside ModalProvider');
  }

  return ctx;
}
