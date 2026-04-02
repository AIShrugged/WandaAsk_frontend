import { HeroChatPreview } from '@/features/landing/ui/hero-chat-preview';
import { HeroMascot } from '@/features/landing/ui/hero-mascot';
import { HeroTyping } from '@/features/landing/ui/HeroTyping';
import { ButtonLink } from '@/shared/ui/button/button-link';

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
        <ButtonLink
          href='/auth/register'
          variant='primary'
          className='tribes-glow-btn text-base font-bold px-9 py-4 h-auto rounded-[10px]'
        >
          Start for Free →
        </ButtonLink>
        <ButtonLink
          href='/auth/login'
          variant='secondary'
          className='text-base px-9 py-4 h-auto rounded-[10px] backdrop-blur-sm'
        >
          Sign In
        </ButtonLink>
      </div>

      <HeroChatPreview />
    </section>
  );
}
