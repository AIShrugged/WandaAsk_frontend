import { X } from 'lucide-react';

export default function ModalHeader({
  title,
  onClick,
  id,
}: {
  title: string;
  onClick: () => void;
  id?: string;
}) {
  return (
    <div className='px-[var(--sp-6)] py-[var(--sp-5)] border-b border-[var(--divider)]'>
      <div className='flex flex-row justify-between items-center gap-4'>
        <p id={id} className='text-base font-semibold text-[var(--foreground)]'>
          {title}
        </p>
        <button
          type='button'
          aria-label='Close modal'
          className='cursor-pointer text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 rounded-[var(--r-sm)]'
          onClick={onClick}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
