'use client';

import { Copy } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ButtonCopy({ copyText }: { copyText: string }) {
  const copy = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      toast.success('Text copied', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        theme: 'light',
      });
    });
  };

  return (
    <button onClick={copy}>
      <Copy className='w-4 h-4 text-primary cursor-pointer' />
    </button>
  );
}
