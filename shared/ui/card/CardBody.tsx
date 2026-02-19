import type { PropsWithChildren } from 'react';

export default function CardBody({ children }: PropsWithChildren) {
  return <div className={'flex h-full flex-col px-4 py-4 md:px-8 md:py-6'}>{children}</div>;
}
