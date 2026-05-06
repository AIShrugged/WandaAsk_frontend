'use client';

import { type PropsWithChildren } from 'react';

import ModalBody from './modal-body';
import ModalHeader from './modal-header';
import { ModalRoot } from './modal-root';

export type ModalProps = PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
}>;

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'sm',
  children,
}: ModalProps) {
  return (
    <ModalRoot open={isOpen} onClose={onClose} size={size}>
      <ModalHeader title={title} onClick={onClose} />
      <ModalBody>{children}</ModalBody>
    </ModalRoot>
  );
}
