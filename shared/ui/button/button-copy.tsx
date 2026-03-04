'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function ButtonCopy({ copyText }: { copyText: string }) {
  const copy = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      toast.success('Text copied');
    });
  };

  return (
    <button onClick={copy}>
      <Copy className='w-4 h-4 text-primary cursor-pointer' />
    </button>
  );
}
