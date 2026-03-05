'use client';

import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { TribesLogo } from '@/shared/ui/brand';

import type { ReactNode } from 'react';

interface MobileSidebarProps {
  children: ReactNode;
}

/**
 * MobileSidebar component.
 * @param props - Component props.
 * @param props.children
 */
export default function MobileSidebar({ children }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    /**
     * handleKeyDown.
     * @param e - e.
     * @returns Result.
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      return document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger button — visible below lg */}
      <button
        className='cursor-pointer lg:hidden flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent transition-colors'
        onClick={() => {
          return setIsOpen(true);
        }}
        aria-label='Open navigation menu'
        aria-expanded={isOpen}
        aria-controls='mobile-sidebar'
      >
        <Menu className='w-5 h-5 text-muted-foreground' />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 lg:hidden ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          return setIsOpen(false);
        }}
        aria-hidden='true'
      />

      {/* Drawer */}
      <aside
        id='mobile-sidebar'
        role='dialog'
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        aria-label='Navigation'
        className={`fixed inset-y-0 left-0 z-50 sidebar-width bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex items-center justify-between h-[var(--topbar-height)] px-6 border-b border-sidebar-border flex-shrink-0'>
          <TribesLogo />
          <button
            className='cursor-pointer flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors'
            onClick={() => {
              return setIsOpen(false);
            }}
            aria-label='Close navigation menu'
          >
            <X className='w-4 h-4 text-muted-foreground' />
          </button>
        </div>

        {/* Close drawer on link click */}
        <div
          className='flex-1 overflow-y-auto py-3 px-3'
          onClick={() => {
            return setIsOpen(false);
          }}
        >
          {children}
        </div>
      </aside>
    </>
  );
}
