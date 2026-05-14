import type { PropsWithChildren } from 'react';

interface ErrorProps extends PropsWithChildren {
  id?: string;
}

// eslint-disable-next-line sonarjs/no-globals-shadowing
export default function Error({ id, children }: ErrorProps) {
  return (
    <p id={id} className='mt-1 text-sm text-destructive' role='alert'>
      {children}
    </p>
  );
}
