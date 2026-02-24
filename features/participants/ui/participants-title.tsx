import type { PropsWithChildren } from 'react';

export default function ParticipantsTitle({ children }: PropsWithChildren) {
  return <p className={'mb-2 text-xl font-medium text-foreground'}>{children}</p>;
}
