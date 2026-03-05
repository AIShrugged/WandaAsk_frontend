import type { PropsWithChildren } from 'react';

/**
 * ModalBody component.
 * @param props - Component props.
 * @param props.children
 */
export default function ModalBody({ children }: PropsWithChildren) {
  if (!children) return null;

  return <div className={'px-7 py-4.5'}>{children}</div>;
}
