import * as motion from 'motion/react-client';

import type { PropsWithChildren } from 'react';

export default function Opacity({ children }: PropsWithChildren) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
