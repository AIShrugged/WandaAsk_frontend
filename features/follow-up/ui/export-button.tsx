'use client';

import { Download } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

type ExportFormat = 'pdf' | 'excel' | 'html';

const FORMATS: { label: string; value: ExportFormat }[] = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Excel', value: 'excel' },
  { label: 'HTML', value: 'html' },
];

interface ExportButtonProps {
  followUpId: number;
}

/**
 * ExportButton — dropdown to export a follow-up in PDF, Excel, or HTML format.
 * Downloads via the Next.js proxy route which forwards auth to the backend.
 * @param props - Component props.
 * @param props.followUpId - The follow-up ID.
 * @returns JSX element.
 */
export function ExportButton({ followUpId }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    right: number;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    /**
     *
     * @param e
     */
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (
        !buttonRef.current?.contains(target) &&
        !target.closest('[data-export-dropdown]')
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   *
   */
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      setDropdownPos({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }

    setIsOpen((v) => {
      return !v;
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        onClick={handleToggle}
        aria-label='Export follow-up'
        aria-expanded={isOpen}
        className='flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-button)] border border-border bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer'
      >
        <Download className='w-3.5 h-3.5' />
        <span className='hidden sm:block'>Export</span>
      </button>

      {isOpen &&
        dropdownPos &&
        createPortal(
          <div
            data-export-dropdown=''
            className='fixed z-[9999] bg-popover border border-border rounded-[var(--radius-card)] shadow-card py-1 w-36'
            style={{ top: dropdownPos.top, right: dropdownPos.right }}
          >
            {FORMATS.map(({ label, value }) => {
              return (
                <a
                  key={value}
                  href={`/api/follow-ups/${followUpId}/export?format=${value}`}
                  download
                  onClick={() => {
                    return setIsOpen(false);
                  }}
                  className='flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer'
                >
                  <Download className='w-3.5 h-3.5 text-muted-foreground' />
                  {label}
                </a>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
