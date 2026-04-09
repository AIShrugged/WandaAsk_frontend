import type { PropsWithChildren } from 'react';

/**
 * ModalFooter component.
 * @param props - Component props.
 * @param props.children
 */
export default function ModalFooter({ children }: PropsWithChildren) {
  if (!children) return null;

  return <div className={'px-7 py-4.5'}>{children}</div>;
}
