'use client';

import { Menu, X } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { TribesLogo } from '@/shared/ui/brand';

import type { ReactNode } from 'react';

interface MobileSidebarProps {
  children: ReactNode;
}
const subscribeToMount = () => {
  return noop;
};
const getMountedSnapshot = () => {
  return true;
};
const getServerMountedSnapshot = () => {
  return false;
};
function noop() {}

/**
 * MobileSidebar component.
 * Renders a hamburger trigger button in the header; the backdrop and drawer are
 * portalled to document.body to escape the header's backdrop-filter containing
 * block (which would otherwise trap fixed-positioned children inside the header).
 * @param props - Component props.
 * @param props.children
 * @returns JSX element.
 */
export default function MobileSidebar({ children }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMounted = useSyncExternalStore(
    subscribeToMount,
    getMountedSnapshot,
    getServerMountedSnapshot,
  );

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
      {/* Hamburger button — stays in the header, visible below lg */}
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

      {/* Backdrop + drawer portalled to body — escapes header's backdrop-filter containing block */}
      {isMounted
        ? createPortal(
            <>
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
            </>,
            document.body,
          )
        : null}
    </>
  );
}
