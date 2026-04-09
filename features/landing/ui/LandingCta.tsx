import Link from 'next/link';

/**
 * Call-to-action section with registration link.
 * @returns {JSX.Element} The rendered component.
 */
export function LandingCta() {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '100px 40px',
        textAlign: 'center',
      }}
    >
      <div
        data-reveal
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          background:
            'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(6,182,212,0.09))',
          border: '1px solid rgba(124,58,237,0.35)',
          borderRadius: '28px',
          padding: '72px 56px',
          boxShadow: '0 0 80px rgba(124,58,237,0.12)',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 52px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: 'white',
            marginBottom: '18px',
            lineHeight: 1.12,
          }}
        >
          Ready to never miss
          <br />
          another follow-up?
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '44px',
            lineHeight: 1.75,
            maxWidth: '480px',
            margin: '0 auto 44px',
          }}
        >
          Join teams already using Tribes to turn every meeting into a
          structured, searchable, and actionable record.
        </p>
        <Link
          href='/auth/register'
          className='tribes-glow-btn'
          style={{
            display: 'inline-block',
            padding: '18px 48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            color: 'white',
            fontSize: '18px',
            fontWeight: 800,
            textDecoration: 'none',
            letterSpacing: '-0.02em',
          }}
        >
          Create Free Account →
        </Link>
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.28)',
            marginTop: '18px',
          }}
        >
          No credit card required · Free to start
        </p>
      </div>
    </section>
  );
}
