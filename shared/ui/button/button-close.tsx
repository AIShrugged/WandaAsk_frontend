import { X } from 'lucide-react';

interface Props {
  size?: number;
  close: () => void;
  'aria-label'?: string;
}

export default function ButtonClose({
  size = 36,
  close,
  'aria-label': ariaLabel = 'Close',
}: Props) {
  return (
    <button onClick={close} aria-label={ariaLabel} className='cursor-pointer'>
      <X
        size={size}
        className='text-muted-foreground hover:text-foreground transition-colors'
      />
    </button>
  );
}
