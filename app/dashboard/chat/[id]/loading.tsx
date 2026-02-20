import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className='flex h-full rounded-2xl overflow-hidden border-primary bg-white shadow-primary items-center justify-center'>
      <Loader2 className='w-6 h-6 text-accent animate-spin' />
    </div>
  );
}
