import type { PropsWithChildren } from 'react';

export default function CardBody({ children }: PropsWithChildren) {
  return <div className='flex h-full flex-col p-6'>{children}</div>;
}
