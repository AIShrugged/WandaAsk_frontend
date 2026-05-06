'use client';

import React, { type PropsWithChildren } from 'react';
import { Toaster } from 'sonner';

import { ModalProvider } from '@/app/providers/ModalProvider';
import { PopupProvider } from '@/app/providers/PopupProvider';

/**
 * Providers component.
 * @param props - Component props.
 * @param props.children
 */
export default function Providers({ children }: PropsWithChildren) {
  return (
    <>
      <Toaster position='top-center' richColors />
      <ModalProvider>
        <PopupProvider>{children}</PopupProvider>
      </ModalProvider>
    </>
  );
}
