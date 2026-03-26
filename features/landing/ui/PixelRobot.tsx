'use client';

import { useEffect, useState } from 'react';

const MIN_DELAY_MS = 4000;
const MAX_EXTRA_MS = 8000;
const SESSION_KEY = 'tribes-robot-shown';

/**
 * PixelRobot — a cute SVG pixel-art AI robot that slides in once per session,
 * winks twice, then slides back off screen.
 */
export function PixelRobot() {
  const [visible, setVisible] = useState(false);
  const [winking, setWinking] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // eslint-disable-next-line sonarjs/pseudo-random
    const delay = MIN_DELAY_MS + Math.random() * MAX_EXTRA_MS;
    const root = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setVisible(true);

      const timers = [
        setTimeout(() => {
          return setWinking(true);
        }, 1200),
        setTimeout(() => {
          return setWinking(false);
        }, 1700),
        setTimeout(() => {
          return setWinking(true);
        }, 2400),
        setTimeout(() => {
          return setWinking(false);
        }, 2900),
        setTimeout(() => {
          return setLeaving(true);
        }, 4600),
        setTimeout(() => {
          return setVisible(false);
        }, 5900),
      ];

      return () => {
        for (const t of timers) clearTimeout(t);
      };
    }, delay);

    return () => {
      return clearTimeout(root);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden='true'
      role='presentation'
      style={{
        position: 'fixed',
        bottom: '28px',
        right: leaving ? '-170px' : '28px',
        zIndex: 9999,
        userSelect: 'none',
        pointerEvents: 'none',
        filter: 'drop-shadow(0 0 18px rgba(124,58,237,0.65))',
        transition: leaving
          ? 'right 1.15s cubic-bezier(0.55, 0, 1, 0.45)'
          : 'right 0.72s cubic-bezier(0, 0.55, 0.45, 1)',
      }}
    >
      <RobotSVG winking={winking} />
    </div>
  );
}

/**
 *
 * @param root0
 * @param root0.winking
 */
function RobotSVG({ winking }: { winking: boolean }) {
  return (
    <svg
      width='88'
      height='120'
      viewBox='0 0 88 120'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      {/* Ground shadow */}
      <ellipse cx='44' cy='117' rx='30' ry='5' fill='rgba(124,58,237,0.18)' />

      {/* Antenna pole */}
      <rect x='41' y='2' width='6' height='14' rx='2' fill='#3b1d8a' />
      {/* Antenna ball */}
      <circle cx='44' cy='3' r='6' fill='#7c3aed' />
      <circle cx='44' cy='3' r='3' fill='#c4b5fd' />
      {/* Antenna pulse ring */}
      <circle
        cx='44'
        cy='3'
        r='8'
        stroke='rgba(196,181,253,0.35)'
        strokeWidth='1.5'
        fill='none'
      />

      {/* Head outer */}
      <rect x='8' y='16' width='72' height='52' rx='11' fill='#1a1840' />
      {/* Head screen */}
      <rect x='13' y='21' width='62' height='42' rx='8' fill='#261f5c' />
      {/* Screen scanlines (subtle) */}
      <rect x='13' y='28' width='62' height='1' fill='rgba(255,255,255,0.03)' />
      <rect x='13' y='36' width='62' height='1' fill='rgba(255,255,255,0.03)' />
      <rect x='13' y='44' width='62' height='1' fill='rgba(255,255,255,0.03)' />
      <rect x='13' y='52' width='62' height='1' fill='rgba(255,255,255,0.03)' />

      {/* Ear bumps */}
      <rect x='0' y='28' width='9' height='20' rx='4.5' fill='#1a1840' />
      <rect x='79' y='28' width='9' height='20' rx='4.5' fill='#1a1840' />

      {/* LEFT EYE socket */}
      <rect x='17' y='29' width='22' height='20' rx='5' fill='#0d0b22' />
      {winking ? (
        /* Wink: closed */
        <rect x='18' y='38' width='20' height='4' rx='2' fill='#c4b5fd' />
      ) : (
        /* Open */
        <>
          <circle cx='28' cy='39' r='7.5' fill='#7c3aed' />
          <circle cx='28' cy='39' r='4' fill='#ddd6fe' />
          <circle cx='30' cy='37' r='1.5' fill='white' />
        </>
      )}

      {/* RIGHT EYE socket */}
      <rect x='49' y='29' width='22' height='20' rx='5' fill='#0d0b22' />
      {/* Right eye always open */}
      <circle cx='60' cy='39' r='7.5' fill='#0891b2' />
      <circle cx='60' cy='39' r='4' fill='#a5f3fc' />
      <circle cx='62' cy='37' r='1.5' fill='white' />

      {/* Smile */}
      <path
        d='M26 53 Q44 65 62 53'
        stroke='#a78bfa'
        strokeWidth='2.5'
        fill='none'
        strokeLinecap='round'
      />

      {/* Cheek blushes */}
      <ellipse cx='16' cy='48' rx='5' ry='3.5' fill='rgba(248,113,113,0.22)' />
      <ellipse cx='72' cy='48' rx='5' ry='3.5' fill='rgba(248,113,113,0.22)' />

      {/* Body outer */}
      <rect x='12' y='72' width='64' height='40' rx='10' fill='#1a1840' />
      {/* Body inner */}
      <rect x='16' y='76' width='56' height='32' rx='7' fill='#261f5c' />

      {/* Chest buttons */}
      <circle cx='30' cy='88' r='5' fill='#7c3aed' />
      <circle cx='44' cy='88' r='5' fill='#06b6d4' />
      <circle cx='58' cy='88' r='5' fill='#4fb268' />

      {/* Body accent line */}
      <rect
        x='22'
        y='98'
        width='44'
        height='3'
        rx='1.5'
        fill='rgba(255,255,255,0.07)'
      />

      {/* Arms */}
      <rect x='0' y='74' width='11' height='28' rx='5.5' fill='#1a1840' />
      <rect x='77' y='74' width='11' height='28' rx='5.5' fill='#1a1840' />

      {/* Legs */}
      <rect x='18' y='112' width='18' height='8' rx='4' fill='#1a1840' />
      <rect x='52' y='112' width='18' height='8' rx='4' fill='#1a1840' />
    </svg>
  );
}
