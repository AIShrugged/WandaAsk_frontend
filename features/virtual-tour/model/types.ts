import type { ReactNode } from 'react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  route?: string;
  illustration?: ReactNode;
  spotlightSelector?: string;
  isLast?: boolean;
}

export interface TourState {
  isOpen: boolean;
  currentStepIndex: number;
  isSaving: boolean;
}

export interface TourActions {
  open: (startIndex?: number) => void;
  close: () => void;
  goNext: () => void;
  goBack: () => void;
  complete: () => void;
}
