'use client';

import { type PropsWithChildren, type ReactNode, useState } from 'react';

import { ModalContext } from '@/shared/ui/modal/modal-context';
import { ModalRoot } from '@/shared/ui/modal/modal-root';

/**
 * ModalProvider component.
 * @param props - Component props.
 * @param props.children
 */
export function ModalProvider({ children }: PropsWithChildren) {
  const [content, setContent] = useState<ReactNode | null>(null);

  return (
    <ModalContext.Provider
      value={{
        open: setContent,
        /**
         * close.
         */
        close: () => {
          return setContent(null);
        },
      }}
    >
      {children}
      <ModalRoot
        open={Boolean(content)}
        onClose={() => {
          return setContent(null);
        }}
      >
        {content}
      </ModalRoot>
    </ModalContext.Provider>
  );
}
