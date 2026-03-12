import { STATS } from '@/features/landing/model/data';

/**
 * Stats bar with key product metrics.
 * @returns {JSX.Element} The rendered component.
 */
export function LandingStats() {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '44px 40px',
        background: 'rgba(255,255,255,0.018)',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '32px',
          textAlign: 'center',
        }}
      >
        {STATS.map((s, i) => {
          return (
            <div key={s.number} data-reveal data-reveal-delay={String(i * 80)}>
              <div
                style={{
                  fontSize: '38px',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(135deg, #c4b5fd, #67e8f9)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.1,
                }}
              >
                {s.number}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: '6px',
                }}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
