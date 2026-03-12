import { STARS } from '@/features/landing/model/data';

/**
 * Fixed cosmic background with nebula gradients and twinkling stars.
 * @returns {JSX.Element} The rendered component.
 */
export function LandingBackground() {
  return (
    <div
      aria-hidden='true'
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '900px',
          height: '700px',
          top: '-250px',
          left: '-200px',
          background:
            'radial-gradient(ellipse, rgba(124,58,237,0.13) 0%, transparent 68%)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '700px',
          height: '500px',
          top: '8%',
          right: '-150px',
          background:
            'radial-gradient(ellipse, rgba(6,182,212,0.09) 0%, transparent 68%)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '500px',
          bottom: '15%',
          left: '15%',
          background:
            'radial-gradient(ellipse, rgba(79,178,104,0.06) 0%, transparent 68%)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '400px',
          bottom: 0,
          right: '10%',
          background:
            'radial-gradient(ellipse, rgba(147,51,234,0.08) 0%, transparent 68%)',
          borderRadius: '50%',
        }}
      />
      {STARS.map((s, i) => {
        return (
          <div
            key={i}
            className='tribes-star'
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.dur,
            }}
          />
        );
      })}
    </div>
  );
}
