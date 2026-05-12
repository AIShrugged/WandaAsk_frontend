import type { PropsWithChildren } from 'react';

export default function ModalBody({ children }: PropsWithChildren) {
  if (!children) return null;

  return <div className='px-[var(--sp-6)] py-[var(--sp-5)]'>{children}</div>;
}
