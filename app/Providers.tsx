'use client';

import React, { type PropsWithChildren } from 'react';
import { ToastContainer } from 'react-toastify';

import { ModalProvider } from '@/app/providers/ModalProvider';
import { PopupProvider } from '@/app/providers/PopupProvider';
import GlobalPopup from '@/shared/ui/layout/global-popup';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <>
      <GlobalPopup />
      <ToastContainer />
      <ModalProvider>
        <PopupProvider>{children}</PopupProvider>
      </ModalProvider>
    </>
  );
}
