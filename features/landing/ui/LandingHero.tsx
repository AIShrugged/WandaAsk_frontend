import Link from 'next/link';

import { HeroChatPreview } from '@/features/landing/ui/hero-chat-preview';
import { HeroMascot } from '@/features/landing/ui/hero-mascot';
import { HeroTyping } from '@/features/landing/ui/HeroTyping';

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
      <HeroMascot />

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
            display: 'inline-block',
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
            display: 'inline-block',
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
            display: 'inline-block',
            backdropFilter: 'blur(8px)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          Sign In
        </Link>
      </div>

      <HeroChatPreview />
    </section>
  );
}
