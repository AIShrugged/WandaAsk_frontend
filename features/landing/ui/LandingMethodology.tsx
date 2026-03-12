const METHODOLOGY_ITEMS = [
  'Custom summary templates per meeting type',
  'Team-specific action item formats',
  'Reusable methodology library',
  'Per-team methodology assignment',
];

const METHODOLOGY_EXAMPLES = [
  { name: 'Sprint Retrospective', tag: 'Engineering', color: '#7c3aed' },
  { name: 'Weekly 1-on-1', tag: 'HR', color: '#0891b2' },
  { name: 'OKR Review', tag: 'Leadership', color: '#059669' },
  { name: 'Product Roadmap', tag: 'Product', color: '#d97706' },
];

/**
 * Methodology feature section with checklist and preview card.
 * @returns {JSX.Element} The rendered component.
 */
export function LandingMethodology() {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '80px 40px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        maxWidth: '960px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '48px',
          alignItems: 'center',
        }}
      >
        {/* Text column */}
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
            Methodologies
          </div>
          <h2
            style={{
              fontSize: 'clamp(24px, 3.5vw, 40px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: 'white',
              marginBottom: '16px',
              lineHeight: 1.2,
            }}
          >
            Run meetings
            <br />
            your way
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.48)',
              lineHeight: 1.75,
              marginBottom: '24px',
            }}
          >
            Define custom meeting templates — OKR reviews, 1-on-1s, sprint
            retros. The AI adapts its summaries and follow-ups to match your
            team&apos;s exact workflow.
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {METHODOLOGY_ITEMS.map((item) => {
              return (
                <li
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.65)',
                  }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'rgba(124,58,237,0.25)',
                      border: '1px solid rgba(124,58,237,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  {item}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Preview card */}
        <div
          data-reveal
          data-reveal-delay='120'
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px',
            padding: '28px',
          }}
        >
          {METHODOLOGY_EXAMPLES.map((m) => {
            return (
              <div
                key={m.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: m.color,
                      boxShadow: `0 0 6px ${m.color}`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {m.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: m.color,
                    background: m.color + '20',
                    border: `1px solid ${m.color}35`,
                    padding: '2px 10px',
                    borderRadius: '100px',
                    fontWeight: 600,
                  }}
                >
                  {m.tag}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
