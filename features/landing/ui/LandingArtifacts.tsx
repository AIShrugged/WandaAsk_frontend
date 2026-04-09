import { ARTIFACTS } from '@/features/landing/model/data';

/**
 * AI output artifacts grid section.
 * @returns {JSX.Element} The rendered component.
 */
export function LandingArtifacts() {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '100px 40px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        maxWidth: '1060px',
        margin: '0 auto',
      }}
    >
      <div data-reveal style={{ textAlign: 'center', marginBottom: '56px' }}>
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
          AI Outputs
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
          Rich structured outputs
          <br />
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>
            not just plain text
          </span>
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.45)',
            marginTop: '18px',
            maxWidth: '500px',
            margin: '18px auto 0',
            lineHeight: 1.75,
          }}
        >
          Every meeting generates a set of structured artifacts — visual,
          searchable, and immediately actionable.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '18px',
        }}
      >
        {ARTIFACTS.map((a, i) => {
          return (
            <div
              key={a.label}
              className='tribes-card'
              data-reveal
              data-reveal-delay={String(i * 60)}
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: `1px solid ${a.color}30`,
                borderRadius: '14px',
                padding: '22px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '11px',
                  background: a.color + '22',
                  border: `1px solid ${a.color}35`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0,
                }}
              >
                {a.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'white',
                    marginBottom: '5px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {a.label}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.43)',
                    lineHeight: 1.6,
                  }}
                >
                  {a.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
