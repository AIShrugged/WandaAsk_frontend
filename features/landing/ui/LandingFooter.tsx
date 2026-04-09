import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '/auth/register', label: 'Register' },
  { href: '/auth/login', label: 'Sign In' },
];

/**
 * Page footer with logo, nav links, and copyright.
 * @returns {JSX.Element} The rendered component.
 */
export function LandingFooter() {
  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '36px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '26px',
            height: '26px',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 900,
          }}
        >
          T
        </div>
        <span style={{ fontWeight: 800, fontSize: '14px' }}>Tribes</span>
      </div>

      <div style={{ display: 'flex', gap: '28px' }}>
        {FOOTER_LINKS.map((link) => {
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.38)',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.22)' }}>
        © 2026 Tribes. All rights reserved.
      </div>
    </footer>
  );
}
