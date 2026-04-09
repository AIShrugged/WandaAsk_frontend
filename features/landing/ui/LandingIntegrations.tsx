import { INTEGRATIONS } from '@/features/landing/model/data';

/**
 * Third-party integrations showcase section.
 * @returns {JSX.Element} The rendered component.
 */
export function LandingIntegrations() {
  return (
    <section
      id='integrations'
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '80px 40px 100px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.012)',
      }}
    >
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div data-reveal>
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
            Integrations
          </div>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 44px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: 'white',
              marginBottom: '18px',
              lineHeight: 1.15,
            }}
          >
            Works with tools
            <br />
            you already use
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: '52px',
              lineHeight: 1.75,
              maxWidth: '440px',
              margin: '0 auto 52px',
            }}
          >
            Connect seamlessly to your calendar and messaging tools — zero
            migration, no disruption.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {INTEGRATIONS.map((intg, i) => {
            return (
              <div
                key={intg.name}
                className='tribes-card'
                data-reveal
                data-reveal-delay={String(i * 90)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '18px',
                  padding: '28px 24px',
                  width: '210px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '44px', marginBottom: '14px' }}>
                  {intg.icon}
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'white',
                    marginBottom: '7px',
                  }}
                >
                  {intg.name}
                </div>
                <div
                  style={{
                    fontSize: '12.5px',
                    color: 'rgba(255,255,255,0.38)',
                    lineHeight: 1.55,
                  }}
                >
                  {intg.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
