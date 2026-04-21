'use client';

import React, { type PropsWithChildren } from 'react';
import { Toaster } from 'sonner';

import { ModalProvider } from '@/app/providers/ModalProvider';
import { PopupProvider } from '@/app/providers/PopupProvider';
import { TourProvider } from '@/features/virtual-tour';
import GlobalPopup from '@/shared/ui/layout/global-popup';

/**
 * Providers component.
 * @param props - Component props.
 * @param props.children
 */
export default function Providers({ children }: PropsWithChildren) {
  return (
    <>
      <GlobalPopup />
      {/* <TourPortal />*/}
      <Toaster position='top-center' richColors />
      <TourProvider>
        <ModalProvider>
          <PopupProvider>{children}</PopupProvider>
        </ModalProvider>
      </TourProvider>
    </>
  );
}
