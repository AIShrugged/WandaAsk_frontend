import { X } from 'lucide-react';

import Hover from '@/shared/ui/animation/Hover';

/**
 * ModalHeader component.
 * @param root0
 * @param root0.title
 * @param root0.onClick
 */
export default function ModalHeader({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <div className='px-6 py-4 border-b border-border'>
      <div className='flex flex-row justify-between items-center'>
        <p className='text-base font-semibold text-foreground'>{title}</p>
        <Hover>
          <button
            className='cursor-pointer text-muted-foreground hover:text-foreground transition-colors'
            onClick={onClick}
          >
            <X size={20} />
          </button>
        </Hover>
      </div>
    </div>
  );
}
