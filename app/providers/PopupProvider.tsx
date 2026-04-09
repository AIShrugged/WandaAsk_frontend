'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  PopupContext,
  type PopupConfig,
} from '@/shared/ui/popup/popup-context';

interface PopupPosition {
  top: number;
  left: number;
}

/**
 * PopupProvider component.
 * @param props - Component props.
 * @param props.children
 */
export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [position, setPosition] = useState<PopupPosition>({ top: 0, left: 0 });
  const calculatePosition = useCallback(
    (anchor: HTMLElement, cfg: PopupConfig): PopupPosition => {
      const rect = anchor.getBoundingClientRect();
      const offset = cfg.offset ?? 8;
      const width = cfg.width ?? 200;
      let top = 0;
      let left = 0;

      switch (cfg.preferredPosition) {
        case 'bottom': {
          top = rect.bottom + offset;
          left = rect.left + rect.width / 2 - width / 2;
          break;
        }
        case 'top': {
          top = rect.top - offset;
          left = rect.left + rect.width / 2 - width / 2;
          break;
        }
        case 'left': {
          top = rect.top + rect.height / 2;
          left = rect.left - width - offset;
          break;
        }
        case 'right': {
          top = rect.top + rect.height / 2;
          left = rect.right + offset;
          break;
        }
        default: {
          top = rect.bottom + offset;
          left = rect.left;
        }
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left + width > viewportWidth) {
        left = viewportWidth - width - offset;
      }

      if (left < offset) {
        left = offset;
      }

      if (top < offset) {
        top = offset;
      }

      if (top + 300 > viewportHeight) {
        // Assume max height 300
        top = viewportHeight - 300 - offset;
      }

      return { top, left };
    },
    [],
  );
  const open = useCallback(
    (anchor: HTMLElement, cfg: PopupConfig) => {
      const pos = calculatePosition(anchor, cfg);

      setPosition(pos);
      setConfig(cfg);
      setIsOpen(true);
    },
    [calculatePosition],
  );
  const close = useCallback(() => {
    setIsOpen(false);
    setConfig(null);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    /**
     * handleClick.
     * @param e - e.
     * @returns Result.
     */
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (!target.closest('[data-popup]')) {
        close();
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      return document.removeEventListener('click', handleClick);
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;

    /**
     * handleEscape.
     * @param e - e.
     * @returns Result.
     */
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      return document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, close]);

  return (
    <PopupContext.Provider value={{ open, close }}>
      {children}
      {isOpen &&
        config &&
        createPortal(
          <div
            data-popup=''
            className='fixed z-50 animate-in fade-in-0 zoom-in-95'
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: config.width ? `${config.width}px` : 'auto',
            }}
          >
            {config.content}
          </div>,
          document.body,
        )}
    </PopupContext.Provider>
  );
}
