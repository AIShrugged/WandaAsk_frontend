import { create } from 'zustand';

import type { TourActions, TourState } from './types';

export const useTourStore = create<TourState & TourActions>((set) => {
  return {
    isOpen: false,
    currentStepIndex: 0,
    isSaving: false,
    open: (startIndex = 0) => {
      set({ isOpen: true, currentStepIndex: startIndex });
    },
    close: () => {
      set({ isOpen: false });
    },
    goNext: () => {
      set((s) => {
        return { currentStepIndex: s.currentStepIndex + 1 };
      });
    },
    goBack: () => {
      set((s) => {
        return { currentStepIndex: Math.max(0, s.currentStepIndex - 1) };
      });
    },
    complete: () => {
      set({ isOpen: false });
    },
  };
});
