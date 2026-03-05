import { LazyMotion, domAnimation } from 'framer-motion';

import type { PropsWithChildren } from 'react';
/**
 * AnimationProvider component.
 * @param props - Component props.
 * @param props.children
 */
export default function AnimationProvider({ children }: PropsWithChildren) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
