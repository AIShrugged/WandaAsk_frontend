/**
 * HeroMascot — animated robot SVG used in the landing hero section.
 * @returns JSX element.
 */
export function HeroMascot() {
  return (
    <div
      data-reveal
      className='tribes-float'
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '36px',
        filter: 'drop-shadow(0 0 28px rgba(124,58,237,0.6))',
      }}
    >
      <svg
        width='110'
        height='150'
        viewBox='0 0 88 120'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        aria-hidden='true'
      >
        <ellipse cx='44' cy='117' rx='30' ry='5' fill='rgba(124,58,237,0.18)' />
        <rect x='41' y='2' width='6' height='14' rx='2' fill='#3b1d8a' />
        <circle cx='44' cy='3' r='6' fill='#7c3aed' />
        <circle cx='44' cy='3' r='3' fill='#c4b5fd' />
        <circle
          cx='44'
          cy='3'
          r='8'
          stroke='rgba(196,181,253,0.35)'
          strokeWidth='1.5'
          fill='none'
        />
        <rect x='8' y='16' width='72' height='52' rx='11' fill='#1a1840' />
        <rect x='13' y='21' width='62' height='42' rx='8' fill='#261f5c' />
        <rect
          x='13'
          y='28'
          width='62'
          height='1'
          fill='rgba(255,255,255,0.03)'
        />
        <rect
          x='13'
          y='36'
          width='62'
          height='1'
          fill='rgba(255,255,255,0.03)'
        />
        <rect
          x='13'
          y='44'
          width='62'
          height='1'
          fill='rgba(255,255,255,0.03)'
        />
        <rect
          x='13'
          y='52'
          width='62'
          height='1'
          fill='rgba(255,255,255,0.03)'
        />
        <rect x='0' y='28' width='9' height='20' rx='4.5' fill='#1a1840' />
        <rect x='79' y='28' width='9' height='20' rx='4.5' fill='#1a1840' />
        <rect x='17' y='29' width='22' height='20' rx='5' fill='#0d0b22' />
        <circle cx='28' cy='39' r='7.5' fill='#7c3aed' />
        <circle cx='28' cy='39' r='4' fill='#ddd6fe' />
        <circle cx='30' cy='37' r='1.5' fill='white' />
        <rect x='49' y='29' width='22' height='20' rx='5' fill='#0d0b22' />
        <circle cx='60' cy='39' r='7.5' fill='#0891b2' />
        <circle cx='60' cy='39' r='4' fill='#a5f3fc' />
        <circle cx='62' cy='37' r='1.5' fill='white' />
        <path
          d='M26 53 Q44 65 62 53'
          stroke='#a78bfa'
          strokeWidth='2.5'
          fill='none'
          strokeLinecap='round'
        />
        <ellipse
          cx='16'
          cy='48'
          rx='5'
          ry='3.5'
          fill='rgba(248,113,113,0.22)'
        />
        <ellipse
          cx='72'
          cy='48'
          rx='5'
          ry='3.5'
          fill='rgba(248,113,113,0.22)'
        />
        <rect x='12' y='72' width='64' height='40' rx='10' fill='#1a1840' />
        <rect x='16' y='76' width='56' height='32' rx='7' fill='#261f5c' />
        <circle cx='30' cy='88' r='5' fill='#7c3aed' />
        <circle cx='44' cy='88' r='5' fill='#06b6d4' />
        <circle cx='58' cy='88' r='5' fill='#4fb268' />
        <rect
          x='22'
          y='98'
          width='44'
          height='3'
          rx='1.5'
          fill='rgba(255,255,255,0.07)'
        />
        <rect x='0' y='74' width='11' height='28' rx='5.5' fill='#1a1840' />
        <rect x='77' y='74' width='11' height='28' rx='5.5' fill='#1a1840' />
        <rect x='18' y='112' width='18' height='8' rx='4' fill='#1a1840' />
        <rect x='52' y='112' width='18' height='8' rx='4' fill='#1a1840' />
      </svg>
    </div>
  );
}
