'use client';

import { useEffect, useRef, useState } from 'react';

// ── Phrases ────────────────────────────────────────────────────────────────

const PHRASES = [
  'Thinking',
  'Pondering',
  'Zigzagging',
  'Reasoning',
  'Analyzing',
  'Reflecting',
  'Cogitating',
  'Processing',
  'Synthesizing',
  'Deliberating',
  'Percolating',
  'Brainstorming',
  'Noodling',
  'Extrapolating',
  'Mulling it over',
  'Connecting dots',
  'Weighing options',
  'Computing',
  'Cross-referencing',
  'Considering',
] as const;

type Phrase = (typeof PHRASES)[number];

/**
 * shuffle.
 * @param arr - arr.
 * @returns Result.
 */
function shuffle(arr: readonly Phrase[]): Phrase[] {
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    // eslint-disable-next-line sonarjs/pseudo-random
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

// ── Component ──────────────────────────────────────────────────────────────

type Phase = 'wait' | 'fadeOut' | 'show';

/**
 * ThinkingIndicator component.
 * @returns Result.
 */
export function ThinkingIndicator() {
  // phrasesRef is initialised with a shuffled deck via useRef(shuffle(...)).
  // This does NOT read a ref during render — it only passes the initial value.
  const phrasesRef = useRef<Phrase[]>(shuffle(PHRASES));

  // Start at -1 so the first step('show') advances to index 0.
  const indexRef = useRef(-1);

  // The displayed phrase; starts with the hardcoded first phrase ('Thinking').
  // No ref access here — avoids the react-hooks/refs violation.
  const [phrase, setPhrase] = useState<Phrase>(PHRASES[0]);

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let pending: ReturnType<typeof setTimeout>;

    /**
     * step.
     * @param phase - phase.
     * @returns Result.
     */
    const step = (phase: Phase) => {
      if (cancelled) return;

      if (phase === 'wait') {
        // Hold the current phrase for 1.5 – 2.5 s before fading out.

        pending = setTimeout(
          () => {
            return step('fadeOut');
          },
          1500 + Math.random() * 1000,
        );
      } else if (phase === 'fadeOut') {
        setVisible(false);
        pending = setTimeout(() => {
          return step('show');
        }, 300);
      } else {
        // Advance to the next phrase; reshuffle when the deck is exhausted.
        indexRef.current += 1;

        if (indexRef.current >= phrasesRef.current.length) {
          phrasesRef.current = shuffle(PHRASES);
          indexRef.current = 0;
        }
        setPhrase(phrasesRef.current[indexRef.current] ?? PHRASES[0]);
        setVisible(true);
        step('wait');
      }
    };

    step('wait');

    return () => {
      cancelled = true;
      clearTimeout(pending);
    };
  }, []);

  const opacityClass = visible ? 'opacity-100' : 'opacity-0';

  return (
    <div className='flex justify-start'>
      <div className='rounded-lg rounded-tl-sm px-4 py-3 bg-card border border-border'>
        <div className='flex items-center gap-2'>
          {/* Dots — slightly smaller than the original typing indicator */}
          <div className='flex items-center gap-0.5'>
            <span
              className='block w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce'
              style={{ animationDelay: '0ms' }}
            />
            <span
              className='block w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce'
              style={{ animationDelay: '150ms' }}
            />
            <span
              className='block w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce'
              style={{ animationDelay: '300ms' }}
            />
          </div>

          {/* Cycling thinking phrase */}
          <span
            className={`text-xs text-muted-foreground/70 select-none transition-opacity duration-300 ${opacityClass}`}
          >
            {phrase}
          </span>
        </div>
      </div>
    </div>
  );
}
