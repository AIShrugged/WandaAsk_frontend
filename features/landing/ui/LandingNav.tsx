import Link from 'next/link';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#integrations', label: 'Integrations' },
];

/**
 * Sticky top navigation with logo, anchor links, and auth buttons.
 * @returns {JSX.Element} The rendered component.
 */
export function LandingNav() {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: '64px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(3,3,8,0.85)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            fontWeight: 900,
          }}
        >
          T
        </div>
        <span
          style={{
            fontWeight: 800,
            fontSize: '17px',
            letterSpacing: '-0.03em',
          }}
        >
          Tribes
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
        {NAV_LINKS.map((link) => {
          return (
            <a
              key={link.href}
              href={link.href}
              className='tribes-nav-link'
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </a>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <Link
          href='/auth/login'
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.13)',
            color: 'rgba(255,255,255,0.75)',
            fontSize: '14px',
            textDecoration: 'none',
            backdropFilter: 'blur(4px)',
          }}
        >
          Sign In
        </Link>
        <Link
          href='/auth/register'
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}
