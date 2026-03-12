import { STEPS } from '@/features/landing/model/data';

/**
 * Three-step onboarding flow section.
 * @returns {JSX.Element} The rendered component.
 */
export function LandingHowItWorks() {
  return (
    <section
      id='how-it-works'
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '80px 40px 100px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.012)',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
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
            How it works
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
            Up and running
            <br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>
              in three steps
            </span>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '40px',
          }}
        >
          {STEPS.map((step, i) => {
            return (
              <div
                key={step.num}
                data-reveal
                data-reveal-delay={String(i * 100)}
              >
                <div
                  style={{
                    fontSize: '72px',
                    fontWeight: 900,
                    color: 'rgba(124,58,237,0.18)',
                    lineHeight: 1,
                    marginBottom: '12px',
                    letterSpacing: '-0.04em',
                  }}
                >
                  {step.num}
                </div>
                <div style={{ fontSize: '34px', marginBottom: '14px' }}>
                  {step.icon}
                </div>
                <h3
                  style={{
                    fontSize: '19px',
                    fontWeight: 700,
                    color: 'white',
                    marginBottom: '10px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.48)',
                    lineHeight: 1.75,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
