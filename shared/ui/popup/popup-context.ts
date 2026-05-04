'use client';

import { createContext, type ReactNode } from 'react';

export interface PopupConfig {
  width?: number;
  maxHeight?: number;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  content: ReactNode | (() => ReactNode);
}

export interface PopupContextValue {
  isOpen: boolean;
  open: (anchor: HTMLElement, config: PopupConfig) => void;
  close: () => void;
}

export const PopupContext = createContext<PopupContextValue | null>(null);
