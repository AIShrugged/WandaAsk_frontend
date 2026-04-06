import { AlertCircle } from 'lucide-react';

interface AiNudgeProps {
  text: string | null;
}

export function AiNudge({ text }: AiNudgeProps) {
  if (!text) return null;

  return (
    <div className='flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3'>
      <AlertCircle className='h-4 w-4 shrink-0 text-amber-500 mt-0.5' />
      <p className='text-sm text-foreground'>{text}</p>
    </div>
  );
}
