import Link from 'next/link';

import { HeroTyping } from '@/features/landing/ui/HeroTyping';

const CHAT_MESSAGES = [
  {
    role: 'user' as const,
    text: "What tasks were assigned in today's product review?",
  },
  {
    role: 'ai' as const,
    text: '3 tasks were assigned: 1) API refactor — Alex, due Friday. 2) Design mockup — Maria, due next Monday. 3) QA sign-off — Tom, due today by 5 PM.',
  },
  {
    role: 'user' as const,
    text: 'Who raised concerns about the release timeline?',
  },
  {
    role: 'ai' as const,
    text: 'David raised timeline concerns at 14:23, suggesting the launch date may need 2 extra weeks for full QA validation.',
  },
];

const MAC_DOTS = ['#ff5f57', '#ffbd2e', '#28c840'];

const DISPLAY_INLINE_BLOCK = 'inline-block';

/**
 * Hero section with robot mascot, headline, CTA buttons, and mock chat card.
 * @returns {JSX.Element} The rendered hero section.
 */
export function LandingHero() {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '100px 40px 120px',
        textAlign: 'center',
        maxWidth: '960px',
        margin: '0 auto',
      }}
    >
      {/* Robot mascot */}
      <div
        data-reveal
        className='tribes-float'
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '36px',
          filter: 'drop-shadow(0 0 28px rgba(124,58,237,0.6))',
        }}
      >
        <svg
          width='110'
          height='150'
          viewBox='0 0 88 120'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          aria-hidden='true'
        >
          <ellipse
            cx='44'
            cy='117'
            rx='30'
            ry='5'
            fill='rgba(124,58,237,0.18)'
          />
          <rect x='41' y='2' width='6' height='14' rx='2' fill='#3b1d8a' />
          <circle cx='44' cy='3' r='6' fill='#7c3aed' />
          <circle cx='44' cy='3' r='3' fill='#c4b5fd' />
          <circle
            cx='44'
            cy='3'
            r='8'
            stroke='rgba(196,181,253,0.35)'
            strokeWidth='1.5'
            fill='none'
          />
          <rect x='8' y='16' width='72' height='52' rx='11' fill='#1a1840' />
          <rect x='13' y='21' width='62' height='42' rx='8' fill='#261f5c' />
          <rect
            x='13'
            y='28'
            width='62'
            height='1'
            fill='rgba(255,255,255,0.03)'
          />
          <rect
            x='13'
            y='36'
            width='62'
            height='1'
            fill='rgba(255,255,255,0.03)'
          />
          <rect
            x='13'
            y='44'
            width='62'
            height='1'
            fill='rgba(255,255,255,0.03)'
          />
          <rect
            x='13'
            y='52'
            width='62'
            height='1'
            fill='rgba(255,255,255,0.03)'
          />
          <rect x='0' y='28' width='9' height='20' rx='4.5' fill='#1a1840' />
          <rect x='79' y='28' width='9' height='20' rx='4.5' fill='#1a1840' />
          <rect x='17' y='29' width='22' height='20' rx='5' fill='#0d0b22' />
          <circle cx='28' cy='39' r='7.5' fill='#7c3aed' />
          <circle cx='28' cy='39' r='4' fill='#ddd6fe' />
          <circle cx='30' cy='37' r='1.5' fill='white' />
          <rect x='49' y='29' width='22' height='20' rx='5' fill='#0d0b22' />
          <circle cx='60' cy='39' r='7.5' fill='#0891b2' />
          <circle cx='60' cy='39' r='4' fill='#a5f3fc' />
          <circle cx='62' cy='37' r='1.5' fill='white' />
          <path
            d='M26 53 Q44 65 62 53'
            stroke='#a78bfa'
            strokeWidth='2.5'
            fill='none'
            strokeLinecap='round'
          />
          <ellipse
            cx='16'
            cy='48'
            rx='5'
            ry='3.5'
            fill='rgba(248,113,113,0.22)'
          />
          <ellipse
            cx='72'
            cy='48'
            rx='5'
            ry='3.5'
            fill='rgba(248,113,113,0.22)'
          />
          <rect x='12' y='72' width='64' height='40' rx='10' fill='#1a1840' />
          <rect x='16' y='76' width='56' height='32' rx='7' fill='#261f5c' />
          <circle cx='30' cy='88' r='5' fill='#7c3aed' />
          <circle cx='44' cy='88' r='5' fill='#06b6d4' />
          <circle cx='58' cy='88' r='5' fill='#4fb268' />
          <rect
            x='22'
            y='98'
            width='44'
            height='3'
            rx='1.5'
            fill='rgba(255,255,255,0.07)'
          />
          <rect x='0' y='74' width='11' height='28' rx='5.5' fill='#1a1840' />
          <rect x='77' y='74' width='11' height='28' rx='5.5' fill='#1a1840' />
          <rect x='18' y='112' width='18' height='8' rx='4' fill='#1a1840' />
          <rect x='52' y='112' width='18' height='8' rx='4' fill='#1a1840' />
        </svg>
      </div>

      {/* Badge */}
      <div
        data-reveal
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 16px',
          borderRadius: '100px',
          border: '1px solid rgba(124,58,237,0.45)',
          background: 'rgba(124,58,237,0.1)',
          marginBottom: '28px',
          fontSize: '13px',
          color: '#a78bfa',
          fontWeight: 500,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#7c3aed',
            display: DISPLAY_INLINE_BLOCK,
            boxShadow: '0 0 6px #7c3aed',
          }}
        />
        AI-Powered Meeting Intelligence
      </div>

      {/* Headline */}
      <div data-reveal data-reveal-delay='80'>
        <HeroTyping />
      </div>

      {/* Subtitle */}
      <p
        data-reveal
        data-reveal-delay='160'
        style={{
          fontSize: '18px',
          lineHeight: 1.75,
          color: 'rgba(255,255,255,0.52)',
          maxWidth: '580px',
          margin: '0 auto 44px',
        }}
      >
        Tribes joins your calls, understands every conversation, and delivers
        instant summaries, action items, and AI insights — so your team always
        knows exactly what to do next.
      </p>

      {/* CTA buttons */}
      <div
        data-reveal
        data-reveal-delay='220'
        style={{
          display: 'flex',
          gap: '14px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Link
          href='/auth/register'
          className='tribes-glow-btn'
          style={{
            padding: '15px 36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 700,
            textDecoration: 'none',
            display: DISPLAY_INLINE_BLOCK,
          }}
        >
          Start for Free →
        </Link>
        <Link
          href='/auth/login'
          style={{
            padding: '15px 36px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '16px',
            textDecoration: 'none',
            display: DISPLAY_INLINE_BLOCK,
            backdropFilter: 'blur(8px)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          Sign In
        </Link>
      </div>

      {/* Mock AI chat card */}
      <div
        data-reveal
        data-reveal-delay='300'
        style={{
          marginTop: '80px',
          display: DISPLAY_INLINE_BLOCK,
          width: '100%',
          maxWidth: '720px',
        }}
      >
        <div
          className='tribes-float'
          style={{
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '18px',
            padding: '28px',
            backdropFilter: 'blur(24px)',
            textAlign: 'left',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', gap: '7px', marginBottom: '20px' }}>
            {MAC_DOTS.map((c) => {
              return (
                <div
                  key={c}
                  style={{
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    background: c,
                  }}
                />
              );
            })}
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            {CHAT_MESSAGES.map((msg, i) => {
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background:
                        msg.role === 'ai'
                          ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
                          : 'rgba(255,255,255,0.12)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {msg.role === 'ai' ? 'T' : '👤'}
                  </div>
                  <div
                    style={{
                      background:
                        msg.role === 'ai'
                          ? 'rgba(124,58,237,0.18)'
                          : 'rgba(255,255,255,0.07)',
                      padding: '11px 15px',
                      borderRadius: '12px',
                      fontSize: '13.5px',
                      color: 'rgba(255,255,255,0.88)',
                      maxWidth: '82%',
                      lineHeight: 1.55,
                      border:
                        msg.role === 'ai'
                          ? '1px solid rgba(124,58,237,0.25)'
                          : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
