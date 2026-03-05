import { X } from 'lucide-react';

interface Props {
  size?: number;
  close: () => void;
}
/**
 * ButtonClose component.
 * @param size
 * @param size.size
 * @param close - close.
 * @param size.close
 */
export default function ButtonClose({ size = 36, close }: Props) {
  return (
    <button onClick={close} className='cursor-pointer'>
      <X
        size={size}
        className='text-muted-foreground hover:text-foreground transition-colors'
      />
    </button>
  );
}
