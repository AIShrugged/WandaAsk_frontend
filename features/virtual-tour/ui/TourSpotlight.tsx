'use client';

import { useEffect, useState } from 'react';

interface SpotlightProps {
  selector: string;
}

/**
 * TourSpotlight component.
 * Renders an SVG mask overlay that highlights a DOM element matched by selector.
 * Uses requestAnimationFrame to avoid layout thrashing.
 * Returns null gracefully if the element is not found.
 * @param root0 - Component props.
 * @param root0.selector - CSS selector for the element to spotlight.
 * @returns JSX element.
 */
export function TourSpotlight({ selector }: SpotlightProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
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

  if (rect === null) return null;

  const { x, y, width, height } = rect;

  return (
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      aria-hidden='true'
    >
      <defs>
        <mask id='tour-cutout'>
          <rect width='100%' height='100%' fill='white' />
          <rect
            x={x - 4}
            y={y - 4}
            width={width + 8}
            height={height + 8}
            rx={6}
            fill='black'
          />
        </mask>
      </defs>
      <rect
        width='100%'
        height='100%'
        fill='rgba(0,0,0,0.55)'
        mask='url(#tour-cutout)'
      />
    </svg>
  );
}
