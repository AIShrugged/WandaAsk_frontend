'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function GlobalPopup() {
  const [state, setState] = useState<any>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: any) => {
      setState(e.detail);
    };
    const closeHandler = () => setState(null);

    globalThis.addEventListener('open-global-popup', handler);
    globalThis.addEventListener('close-global-popup', closeHandler);

    return () => {
      globalThis.removeEventListener('open-global-popup', handler);
      globalThis.removeEventListener('close-global-popup', closeHandler);
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    const clickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        state.anchorEl &&
        !state.anchorEl.contains(e.target as Node)
      ) {
        setState(null);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [state]);

  if (!state) return null;

  const rect = state.anchorEl.getBoundingClientRect();
  const style: React.CSSProperties = {
    position: 'fixed',
    top: rect.bottom + 8,
    left: rect.left + rect.width / 2,
    transform: 'translateX(-50%)',
    width: typeof state.width === 'number' ? `${state.width}px` : state.width,
    zIndex: 9999,
    pointerEvents: 'auto',
  };

  return createPortal(
    <div ref={popupRef} style={style} className='shadow-card rounded-[var(--radius-card)]'>
      {state.content}
    </div>,
    document.body,
  );
}
