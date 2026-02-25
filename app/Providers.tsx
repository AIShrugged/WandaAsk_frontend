'use client';

import React, { type PropsWithChildren } from 'react';
import { ToastContainer } from 'react-toastify';

import { DevDebugProvider } from '@/app/providers/DevDebugProvider';
import { ModalProvider } from '@/app/providers/ModalProvider';
import { PopupProvider } from '@/app/providers/PopupProvider';
import GlobalPopup from '@/shared/ui/layout/global-popup';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <>
      <DevDebugProvider />
      <GlobalPopup />
      <ToastContainer />
      <ModalProvider>
        <PopupProvider>{children}</PopupProvider>
      </ModalProvider>
    </>
  );
}
