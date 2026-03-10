const STARS = [
  { top: '4%', left: '9%', size: 2, delay: '0s', dur: '3.2s' },
  { top: '12%', left: '83%', size: 1, delay: '1.1s', dur: '4.4s' },
  { top: '28%', left: '44%', size: 2, delay: '0.4s', dur: '5.1s' },
  { top: '48%', left: '18%', size: 1, delay: '2.1s', dur: '3.6s' },
  { top: '63%', left: '72%', size: 2, delay: '1.6s', dur: '4.7s' },
  { top: '78%', left: '33%', size: 1, delay: '0.9s', dur: '3.3s' },
  { top: '88%', left: '58%', size: 2, delay: '2.6s', dur: '5.6s' },
  { top: '19%', left: '28%', size: 1, delay: '1.3s', dur: '4.3s' },
  { top: '38%', left: '91%', size: 2, delay: '0.2s', dur: '3.9s' },
  { top: '68%', left: '4%', size: 1, delay: '1.9s', dur: '4.9s' },
  { top: '7%', left: '53%', size: 1, delay: '0.7s', dur: '3.7s' },
  { top: '54%', left: '49%', size: 2, delay: '2.3s', dur: '5.3s' },
  { top: '23%', left: '66%', size: 1, delay: '0.8s', dur: '4.2s' },
  { top: '83%', left: '14%', size: 2, delay: '1.5s', dur: '3.4s' },
  { top: '43%', left: '7%', size: 1, delay: '2.9s', dur: '5.9s' },
  { top: '33%', left: '77%', size: 1, delay: '0.5s', dur: '4.5s' },
  { top: '72%', left: '42%', size: 2, delay: '1.7s', dur: '3.1s' },
  { top: '16%', left: '61%', size: 1, delay: '3.2s', dur: '6.1s' },
  { top: '57%', left: '88%', size: 2, delay: '0.6s', dur: '4.0s' },
  { top: '93%', left: '25%', size: 1, delay: '2.0s', dur: '5.0s' },
];

/**
 * CosmicBackground — fixed dark-space backdrop with gradient orbs and twinkling stars.
 * Server Component — no client JS required (all animation via CSS).
 */
export function CosmicBackground() {
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
      {/* Violet orb — top-left */}
      <div
        style={{
          position: 'absolute',
          width: '800px',
          height: '600px',
          top: '-200px',
          left: '-180px',
          background:
            'radial-gradient(ellipse, rgba(124,58,237,0.13) 0%, transparent 68%)',
          borderRadius: '50%',
        }}
      />
      {/* Cyan orb — top-right */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '450px',
          top: '8%',
          right: '-120px',
          background:
            'radial-gradient(ellipse, rgba(6,182,212,0.09) 0%, transparent 68%)',
          borderRadius: '50%',
        }}
      />
      {/* Green orb — bottom-left */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '400px',
          bottom: '15%',
          left: '15%',
          background:
            'radial-gradient(ellipse, rgba(79,178,104,0.05) 0%, transparent 68%)',
          borderRadius: '50%',
        }}
      />
      {/* Purple orb — bottom-right */}
      <div
        style={{
          position: 'absolute',
          width: '450px',
          height: '350px',
          bottom: 0,
          right: '10%',
          background:
            'radial-gradient(ellipse, rgba(147,51,234,0.08) 0%, transparent 68%)',
          borderRadius: '50%',
        }}
      />

      {/* Star particles */}
      {STARS.map((s, i) => {
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              borderRadius: '50%',
              background: 'white',
              animation: `cosmic-twinkle ${s.dur} ${s.delay} linear infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
