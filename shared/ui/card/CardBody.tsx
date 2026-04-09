import type { PropsWithChildren } from 'react';

/**
 * CardBody component.
 * @param props - Component props.
 * @param props.children
 */
export default function CardBody({ children }: PropsWithChildren) {
  return <div className='flex h-full flex-col p-6'>{children}</div>;
}
