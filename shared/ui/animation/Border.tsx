import * as motion from 'motion/react-client';

import type { PropsWithChildren } from 'react';

export default function Border({ children }: PropsWithChildren) {
  return (
    <motion.div
      initial={{
        boxShadow: 'none',
      }}
      whileHover={{
        boxShadow: '0 4px 12px 0 rgba(0,0,0,0.12)',
      }}
      transition={{
        duration: 0.3,
      }}
    >
      {children}
    </motion.div>
  );
}
