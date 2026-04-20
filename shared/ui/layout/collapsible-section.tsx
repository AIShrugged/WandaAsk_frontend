'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CollapsibleSectionProps {
  label: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function CollapsibleSection({
  label,
  icon,
  defaultOpen = true,
  className,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type='button'
        onClick={() => {
          setOpen((v) => {
            return !v;
          });
        }}
        aria-label={open ? `Hide ${label}` : `Show ${label}`}
        aria-expanded={open}
        className='flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none mb-2'
      >
        {icon}
        {label}
        <ChevronDown
          className='h-3.5 w-3.5 transition-transform duration-200'
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
