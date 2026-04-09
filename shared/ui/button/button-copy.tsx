'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ButtonCopy component.
 * @param props - Component props.
 * @param props.copyText
 */
export default function ButtonCopy({ copyText }: { copyText: string }) {
  /**
   * copy.
   */
  const copy = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      toast.success('Text copied');
    });
  };

  return (
    <button onClick={copy} className='cursor-pointer'>
      <Copy className='w-4 h-4 text-primary cursor-pointer' />
    </button>
  );
}
