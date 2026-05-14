'use client';

import { Loader2 } from 'lucide-react';

interface Props {
  onCancel?: () => void;
}

export function OnboardingProcessingStep({ onCancel }: Props) {
  return (
    <div className='flex flex-col items-center justify-center gap-6 py-16 text-center'>
      <Loader2 className='h-10 w-10 animate-spin text-primary' />
      <div>
        <h2 className='text-xl font-semibold text-foreground'>
          Analyzing your organization
        </h2>
        <p className='mt-2 text-sm text-muted-foreground max-w-sm'>
          Our AI is generating a structure based on your description. This
          usually takes 30–60 seconds.
        </p>
      </div>
      {onCancel && (
        <button
          type='button'
          className='text-sm text-muted-foreground hover:underline focus-visible:outline-none focus-visible:underline'
          onClick={onCancel}
        >
          Cancel and skip for now
        </button>
      )}
    </div>
  );
}
