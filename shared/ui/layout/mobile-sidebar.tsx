'use client';

import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import type { ReactNode } from 'react';

interface MobileSidebarProps {
  children: ReactNode;
}

export default function MobileSidebar({ children }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger button — visible on mobile only */}
      <button
        className='md:hidden flex items-center justify-center w-11 h-11 rounded-lg hover:bg-hover-light transition-colors'
        onClick={() => setIsOpen(true)}
        aria-label='Open navigation menu'
        aria-expanded={isOpen}
        aria-controls='mobile-sidebar'
      >
        <Menu className='w-6 h-6 text-accent' />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden='true'
      />

      {/* Drawer */}
      <aside
        id='mobile-sidebar'
        className={`fixed inset-y-0 left-0 z-50 w-[238px] bg-gradient-primary flex flex-col py-4 pl-4 pr-0 transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label='Navigation'
      >
        <div className='flex items-center justify-between pl-4 pr-4 mb-4'>
          <div className='h-[50px] flex items-center text-primary font-medium'>
            logo
          </div>
          <button
            className='flex items-center justify-center w-11 h-11 rounded-lg hover:bg-hover-light transition-colors'
            onClick={() => setIsOpen(false)}
            aria-label='Close navigation menu'
          >
            <X className='w-5 h-5 text-accent' />
          </button>
        </div>

        {/* Close drawer on link click */}
        <div onClick={() => setIsOpen(false)}>{children}</div>
      </aside>
    </>
  );
}
