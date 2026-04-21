'use client';

import { useEffect, useState } from 'react';

/**
 * Returns the DOMRect of the element matching `selector`, updated on resize.
 * Returns null if selector is undefined or no element is found.
 */
export function useTourSpotlight(selector: string | undefined): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (selector === undefined) {
      // Reset asynchronously to avoid synchronous setState-in-effect warning
      requestAnimationFrame(() => {
        setRect(null);
      });
      return;
    }

    const update = () => {
      requestAnimationFrame(() => {
        const el = document.querySelector(selector);
        setRect(el?.getBoundingClientRect() ?? null);
      });
    };

    update();

    const el = document.querySelector(selector);
    const ro = new ResizeObserver(update);

    if (el !== null) ro.observe(el);

    globalThis.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      globalThis.removeEventListener('resize', update);
    };
  }, [selector]);

  return rect;
}
