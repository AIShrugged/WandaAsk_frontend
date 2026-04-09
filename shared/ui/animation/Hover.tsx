import * as motion from 'motion/react-client';

import type { PropsWithChildren } from 'react';

/**
 * Hover component.
 * @param props - Component props.
 * @param props.children
 */
export default function Hover({ children }: PropsWithChildren) {
  return (
    <motion.div
      className={'flex'}
      whileHover={{
        scale: 1.1,
        transition: { duration: 0.25, ease: 'linear' },
      }}
      whileTap={{ scale: 0.8 }}
    >
      {children}
    </motion.div>
  );
}
