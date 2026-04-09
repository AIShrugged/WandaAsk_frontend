import type { PropsWithChildren } from 'react';

/**
 * ParticipantsTitle component.
 * @param props - Component props.
 * @param props.children
 */
export default function ParticipantsTitle({ children }: PropsWithChildren) {
  return (
    <p className={'text-base font-semibold text-foreground line-clamp-2 mb-2'}>
      {children}
    </p>
  );
}
