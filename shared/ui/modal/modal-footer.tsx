import type { PropsWithChildren } from 'react';

export default function ModalFooter({ children }: PropsWithChildren) {
  if (!children) return null;

  return (
    <div className='px-[var(--sp-6)] py-[var(--sp-5)] border-t border-[var(--divider)] flex items-center justify-end gap-[var(--sp-3)]'>
      {children}
    </div>
  );
}
