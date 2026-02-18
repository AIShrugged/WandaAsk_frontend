'use client';

import { useContext } from 'react';

import { PopupContext } from '@/shared/ui/popup/popup-context';

export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within PopupProvider');
  }
  return context;
}
