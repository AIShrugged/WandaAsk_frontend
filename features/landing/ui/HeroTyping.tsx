'use client';

import { useEffect, useState } from 'react';

const PHRASES = [
  'Stop Losing Ideas After Every Meeting',
  'Turn Meetings into Instant Actions',
  'Never Miss a Follow-Up Again',
  'Your AI Co-Pilot for Every Call',
  'Make Every Meeting Count',
];

const TYPE_MS = 52;

const DELETE_MS = 28;

const PAUSE_TYPED_MS = 2300;

const PAUSE_DELETED_MS = 420;

/**
 * HeroTyping — animated typewriter headline with a glowing cursor.
 */
export function HeroTyping() {
  const [text, setText] = useState('');

  const [phraseIdx, setPhraseIdx] = useState(0);

  const [deleting, setDeleting] = useState(false);

  const [cursorOn, setCursorOn] = useState(true);

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => {
      return setCursorOn((v) => {
        return !v;
      });
    }, 530);

    return () => {
      return clearInterval(id);
    };
  }, []);

  // Typing engine — each branch owns its timer ID so cleanups are distinct
  useEffect(() => {
    const phrase = PHRASES[phraseIdx];

    if (!deleting && text === phrase) {
      const id = setTimeout(() => {
        return setDeleting(true);
      }, PAUSE_TYPED_MS);

      return () => {
        return clearTimeout(id);
      };
    }

    if (deleting && text === '') {
      const id = setTimeout(() => {
        setDeleting(false);
        setPhraseIdx((i) => {
          return (i + 1) % PHRASES.length;
        });
      }, PAUSE_DELETED_MS);

      return () => {
        return clearTimeout(id);
      };
    }

    const id = setTimeout(
      () => {
        return setText(
          deleting ? text.slice(0, -1) : phrase.slice(0, text.length + 1),
        );
      },
      deleting ? DELETE_MS : TYPE_MS,
    );

    return () => {
      return clearTimeout(id);
    };
  }, [text, deleting, phraseIdx]);

  return (
    <h1
      style={{
        fontSize: 'clamp(34px, 5.5vw, 66px)',
        fontWeight: 900,
        lineHeight: 1.12,
        letterSpacing: '-0.04em',
        marginBottom: '24px',
        minHeight: '2.5em',
      }}
    >
      <span
        style={{
          background:
            'linear-gradient(135deg, #ffffff 0%, #c4b5fd 45%, #67e8f9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {text}
      </span>
      {/* Glowing cursor */}
      <span
        aria-hidden='true'
        style={{
          display: 'inline-block',
          width: '3px',
          height: '0.72em',
          marginLeft: '4px',
          marginBottom: '0.1em',
          borderRadius: '2px',
          background: 'linear-gradient(180deg, #c4b5fd, #67e8f9)',
          opacity: cursorOn ? 1 : 0,
          transition: 'opacity 0.08s ease',
          boxShadow: cursorOn
            ? '0 0 10px rgba(196,181,253,0.95), 0 0 22px rgba(103,232,249,0.5)'
            : 'none',
          verticalAlign: 'text-bottom',
        }}
      />
    </h1>
  );
}
