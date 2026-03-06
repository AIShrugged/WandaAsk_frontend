'use client';

import { useEffect } from 'react';

/**
 * ScrollReveal — behaviour-only component.
 * Installs an IntersectionObserver that adds the `is-revealed` class
 * to every element with `[data-reveal]` when it enters the viewport.
 * Supports `data-reveal-delay="ms"` for stagger effects.
 */
export function ScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;

            const delay = el.dataset.revealDelay ?? '0';

            el.style.transitionDelay = `${delay}ms`;
            el.classList.add('is-revealed');
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.1 },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => {
      return observer.disconnect();
    };
  }, []);

  return null;
}
