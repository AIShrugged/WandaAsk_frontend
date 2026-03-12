import { FEATURES } from '@/features/landing/model/data';

/**
 * Features grid section showcasing product capabilities.
 * @returns {JSX.Element} The rendered component.
 */
export function LandingFeatures() {
  return (
    <section
      id='features'
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '100px 40px',
        maxWidth: '1120px',
        margin: '0 auto',
      }}
    >
      <div data-reveal style={{ textAlign: 'center', marginBottom: '64px' }}>
        <div
          style={{
            fontSize: '12px',
            color: '#a78bfa',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          Features
        </div>
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 50px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: 'white',
            lineHeight: 1.15,
          }}
        >
          Everything your team needs
          <br />
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>
            from every meeting
          </span>
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '20px',
        }}
      >
        {FEATURES.map((f, i) => {
          return (
            <div
              key={f.title}
              className='tribes-card'
              data-reveal
              data-reveal-delay={String(i * 70)}
              style={{
                background: 'rgba(255,255,255,0.028)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px',
                padding: '28px',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '13px',
                  background: f.accent + '25',
                  border: `1px solid ${f.accent}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginBottom: '18px',
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'white',
                  marginBottom: '9px',
                  letterSpacing: '-0.01em',
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.48)',
                  lineHeight: 1.75,
                }}
              >
                {f.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
