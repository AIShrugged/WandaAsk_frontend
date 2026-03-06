import Link from 'next/link';

import { HeroTyping } from '@/features/landing/ui/HeroTyping';
import { PixelRobot } from '@/features/landing/ui/PixelRobot';
import { ScrollReveal } from '@/features/landing/ui/ScrollReveal';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tribes — AI Meeting Intelligence Platform',
  description:
    'Tribes joins your meetings, transcribes every word, and delivers instant summaries, action items, and AI-powered insights — so your team never loses a decision again.',
  keywords: [
    'AI meeting assistant',
    'meeting summaries',
    'action items',
    'meeting transcription',
    'meeting intelligence',
    'team productivity',
    'Tribes',
  ],
  openGraph: {
    title: 'Tribes — AI Meeting Intelligence Platform',
    description:
      'Your AI co-pilot for every meeting. Instant summaries, action items, and insights — delivered automatically.',
    type: 'website',
    siteName: 'Tribes',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tribes — AI Meeting Intelligence Platform',
    description:
      'Your AI co-pilot for every meeting. Instant summaries, action items, and insights — delivered automatically.',
  },
};

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI Meeting Bot',
    desc: 'The AI bot automatically joins your scheduled calls and silently records every word, so you stay fully present in the conversation.',
    accent: '#7c3aed',
  },
  {
    icon: '📋',
    title: 'Instant Summaries',
    desc: 'Full meeting recap with key decisions, discussion points, and next steps — ready within seconds after the call ends.',
    accent: '#0891b2',
  },
  {
    icon: '✅',
    title: 'Action Item Extraction',
    desc: 'Tasks are identified, assigned to the right team members, and tracked with due dates — automatically, no manual input needed.',
    accent: '#059669',
  },
  {
    icon: '💬',
    title: 'AI Chat Assistant',
    desc: 'Ask anything about any past meeting in plain English. Get instant, accurate answers backed by actual transcripts.',
    accent: '#d97706',
  },
  {
    icon: '👥',
    title: 'Team Workspace',
    desc: 'Organize your company into teams, invite members, set methodologies, and manage access to meeting data.',
    accent: '#dc2626',
  },
  {
    icon: '📊',
    title: 'Analytics & Reports',
    desc: 'Visualize meeting frequency, talk-time, action item completion rates, and team productivity with interactive charts.',
    accent: '#9333ea',
  },
];

const STEPS = [
  {
    num: '01',
    icon: '📅',
    title: 'Connect your calendar',
    desc: 'Authorize Google Calendar in one click. Tribes reads your upcoming meetings and is ready to join automatically.',
  },
  {
    num: '02',
    icon: '🎙️',
    title: 'AI joins your calls',
    desc: 'The bot enters as a silent participant, transcribes every word, and identifies each speaker in real time.',
  },
  {
    num: '03',
    icon: '⚡',
    title: 'Receive intelligence',
    desc: 'Get structured summaries, assigned tasks, and deep insights delivered before your next meeting even starts.',
  },
];

const ARTIFACTS = [
  {
    icon: '📄',
    label: 'Meeting Summary Card',
    desc: 'Title, participants, key decisions, and discussion highlights in one card',
    color: '#7c3aed',
  },
  {
    icon: '📋',
    label: 'Task Table',
    desc: 'Assignee, title, status, and due date — sorted and ready to act on',
    color: '#0891b2',
  },
  {
    icon: '💬',
    label: 'Transcript View',
    desc: 'Speaker-identified, timestamped transcript of every spoken word',
    color: '#059669',
  },
  {
    icon: '💡',
    label: 'Insight Cards',
    desc: 'AI-generated insights about participants, topics, and patterns',
    color: '#d97706',
  },
  {
    icon: '📊',
    label: 'Charts & Analytics',
    desc: 'Bar, line, and area charts for meeting metrics and trends',
    color: '#9333ea',
  },
  {
    icon: '👥',
    label: 'People List',
    desc: 'Participant profiles with roles, engagement levels, and history',
    color: '#dc2626',
  },
];

const INTEGRATIONS = [
  {
    icon: '📅',
    name: 'Google Calendar',
    desc: 'Sync your schedule — the AI bot auto-joins every event',
  },
  {
    icon: '✈️',
    name: 'Telegram',
    desc: 'Get notifications and interact with the AI via bot',
  },
  {
    icon: '🎥',
    name: 'Any Video Call',
    desc: 'Zoom, Google Meet, Teams — joins them all',
  },
];

const STATS = [
  { number: '10×', label: 'Faster follow-up' },
  { number: '100%', label: 'Transcript accuracy' },
  { number: '< 60s', label: 'Summary delivery' },
  { number: '∞', label: 'Meeting history' },
];

const STARS = [
  { top: '4%', left: '9%', size: '2px', delay: '0s', dur: '3.2s' },
  { top: '12%', left: '83%', size: '1px', delay: '1.1s', dur: '4.4s' },
  { top: '28%', left: '44%', size: '2px', delay: '0.4s', dur: '5.1s' },
  { top: '48%', left: '18%', size: '1px', delay: '2.1s', dur: '3.6s' },
  { top: '63%', left: '72%', size: '2px', delay: '1.6s', dur: '4.7s' },
  { top: '78%', left: '33%', size: '1px', delay: '0.9s', dur: '3.3s' },
  { top: '88%', left: '58%', size: '2px', delay: '2.6s', dur: '5.6s' },
  { top: '19%', left: '28%', size: '1px', delay: '1.3s', dur: '4.3s' },
  { top: '38%', left: '91%', size: '2px', delay: '0.2s', dur: '3.9s' },
  { top: '68%', left: '4%', size: '1px', delay: '1.9s', dur: '4.9s' },
  { top: '7%', left: '53%', size: '1px', delay: '0.7s', dur: '3.7s' },
  { top: '54%', left: '49%', size: '2px', delay: '2.3s', dur: '5.3s' },
  { top: '23%', left: '66%', size: '1px', delay: '0.8s', dur: '4.2s' },
  { top: '83%', left: '14%', size: '2px', delay: '1.5s', dur: '3.4s' },
  { top: '43%', left: '7%', size: '1px', delay: '2.9s', dur: '5.9s' },
  { top: '33%', left: '77%', size: '1px', delay: '0.5s', dur: '4.5s' },
  { top: '72%', left: '42%', size: '2px', delay: '1.7s', dur: '3.1s' },
  { top: '16%', left: '61%', size: '1px', delay: '3.2s', dur: '6.1s' },
  { top: '57%', left: '88%', size: '2px', delay: '0.6s', dur: '4.0s' },
  { top: '93%', left: '25%', size: '1px', delay: '2.0s', dur: '5.0s' },
];

/**
 * LandingPage — public marketing page for Tribes.
 * Server Component. Client interactivity via imported 'use client' components.
 */
export default function Home() {
  return (
    <>
      <style>{`
        /* ── Cosmic animations ──────────────────────────────────────── */
        @keyframes tribes-twinkle {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 0.95; }
        }
        @keyframes tribes-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes tribes-glow {
          0%, 100% {
            box-shadow: 0 0 24px rgba(124,58,237,0.35),
                        0 0 48px rgba(124,58,237,0.15);
          }
          50% {
            box-shadow: 0 0 40px rgba(124,58,237,0.65),
                        0 0 80px rgba(124,58,237,0.28);
          }
        }

        /* ── Star particles ─────────────────────────────────────────── */
        .tribes-star {
          position: absolute;
          border-radius: 50%;
          background: white;
          animation: tribes-twinkle linear infinite;
        }

        /* ── Hero card float ────────────────────────────────────────── */
        .tribes-float { animation: tribes-float 7s ease-in-out infinite; }

        /* ── CTA glow pulse ─────────────────────────────────────────── */
        .tribes-glow-btn { animation: tribes-glow 3s ease-in-out infinite; }

        /* ── Nav link hover ─────────────────────────────────────────── */
        .tribes-nav-link { transition: color 0.15s; }
        .tribes-nav-link:hover { color: rgba(255,255,255,0.95) !important; }

        /* ── Card hover lift ────────────────────────────────────────── */
        .tribes-card {
          transition: border-color 0.2s, transform 0.22s;
        }
        .tribes-card:hover {
          border-color: rgba(255,255,255,0.15) !important;
          transform: translateY(-3px);
        }

        /* ── Scroll reveal ──────────────────────────────────────────── */
        [data-reveal] {
          opacity: 0;
          transform: translateY(28px);
          transition:
            opacity  0.65s cubic-bezier(0.4, 0, 0.2, 1),
            transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
        }
        [data-reveal].is-revealed {
          opacity: 1;
          transform: none;
        }
      `}</style>

      {/* Behaviour-only client components */}
      <ScrollReveal />
      <PixelRobot />

      <div
        style={{
          background: '#030308',
          minHeight: '100vh',
          color: 'white',
          fontFamily: 'var(--font-inter-sans), system-ui, sans-serif',
          overflowX: 'hidden',
        }}
      >
        {/* ── Cosmic background ────────────────────────────────────── */}
        <div
          aria-hidden='true'
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '900px',
              height: '700px',
              top: '-250px',
              left: '-200px',
              background:
                'radial-gradient(ellipse, rgba(124,58,237,0.13) 0%, transparent 68%)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '700px',
              height: '500px',
              top: '8%',
              right: '-150px',
              background:
                'radial-gradient(ellipse, rgba(6,182,212,0.09) 0%, transparent 68%)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '600px',
              height: '500px',
              bottom: '15%',
              left: '15%',
              background:
                'radial-gradient(ellipse, rgba(79,178,104,0.06) 0%, transparent 68%)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '500px',
              height: '400px',
              bottom: 0,
              right: '10%',
              background:
                'radial-gradient(ellipse, rgba(147,51,234,0.08) 0%, transparent 68%)',
              borderRadius: '50%',
            }}
          />
          {STARS.map((s, i) => {
            return (
              <div
                key={i}
                className='tribes-star'
                style={{
                  top: s.top,
                  left: s.left,
                  width: s.size,
                  height: s.size,
                  animationDelay: s.delay,
                  animationDuration: s.dur,
                }}
              />
            );
          })}
        </div>

        {/* ── Navigation ───────────────────────────────────────────── */}
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
            {[
              { href: '#features', label: 'Features' },
              { href: '#how-it-works', label: 'How it works' },
              { href: '#integrations', label: 'Integrations' },
            ].map((link) => {
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

        {/* ── Hero ─────────────────────────────────────────────────── */}
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
          {/* ── Hero mascot robot ─────────────────────────────────── */}
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
              {/* Ground shadow */}
              <ellipse
                cx='44'
                cy='117'
                rx='30'
                ry='5'
                fill='rgba(124,58,237,0.18)'
              />

              {/* Antenna pole */}
              <rect x='41' y='2' width='6' height='14' rx='2' fill='#3b1d8a' />
              {/* Antenna ball */}
              <circle cx='44' cy='3' r='6' fill='#7c3aed' />
              <circle cx='44' cy='3' r='3' fill='#c4b5fd' />
              {/* Antenna pulse ring */}
              <circle
                cx='44'
                cy='3'
                r='8'
                stroke='rgba(196,181,253,0.35)'
                strokeWidth='1.5'
                fill='none'
              />

              {/* Head outer */}
              <rect
                x='8'
                y='16'
                width='72'
                height='52'
                rx='11'
                fill='#1a1840'
              />
              {/* Head screen */}
              <rect
                x='13'
                y='21'
                width='62'
                height='42'
                rx='8'
                fill='#261f5c'
              />
              {/* Screen scanlines */}
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

              {/* Ear bumps */}
              <rect
                x='0'
                y='28'
                width='9'
                height='20'
                rx='4.5'
                fill='#1a1840'
              />
              <rect
                x='79'
                y='28'
                width='9'
                height='20'
                rx='4.5'
                fill='#1a1840'
              />

              {/* LEFT EYE socket */}
              <rect
                x='17'
                y='29'
                width='22'
                height='20'
                rx='5'
                fill='#0d0b22'
              />
              <circle cx='28' cy='39' r='7.5' fill='#7c3aed' />
              <circle cx='28' cy='39' r='4' fill='#ddd6fe' />
              <circle cx='30' cy='37' r='1.5' fill='white' />

              {/* RIGHT EYE socket */}
              <rect
                x='49'
                y='29'
                width='22'
                height='20'
                rx='5'
                fill='#0d0b22'
              />
              <circle cx='60' cy='39' r='7.5' fill='#0891b2' />
              <circle cx='60' cy='39' r='4' fill='#a5f3fc' />
              <circle cx='62' cy='37' r='1.5' fill='white' />

              {/* Smile */}
              <path
                d='M26 53 Q44 65 62 53'
                stroke='#a78bfa'
                strokeWidth='2.5'
                fill='none'
                strokeLinecap='round'
              />

              {/* Cheek blushes */}
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

              {/* Body outer */}
              <rect
                x='12'
                y='72'
                width='64'
                height='40'
                rx='10'
                fill='#1a1840'
              />
              {/* Body inner */}
              <rect
                x='16'
                y='76'
                width='56'
                height='32'
                rx='7'
                fill='#261f5c'
              />

              {/* Chest buttons */}
              <circle cx='30' cy='88' r='5' fill='#7c3aed' />
              <circle cx='44' cy='88' r='5' fill='#06b6d4' />
              <circle cx='58' cy='88' r='5' fill='#4fb268' />

              {/* Body accent line */}
              <rect
                x='22'
                y='98'
                width='44'
                height='3'
                rx='1.5'
                fill='rgba(255,255,255,0.07)'
              />

              {/* Arms */}
              <rect
                x='0'
                y='74'
                width='11'
                height='28'
                rx='5.5'
                fill='#1a1840'
              />
              <rect
                x='77'
                y='74'
                width='11'
                height='28'
                rx='5.5'
                fill='#1a1840'
              />

              {/* Legs */}
              <rect
                x='18'
                y='112'
                width='18'
                height='8'
                rx='4'
                fill='#1a1840'
              />
              <rect
                x='52'
                y='112'
                width='18'
                height='8'
                rx='4'
                fill='#1a1840'
              />
            </svg>
          </div>

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

          {/* TypeIt headline — client component */}
          <div data-reveal data-reveal-delay='80'>
            <HeroTyping />
          </div>

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
            Tribes joins your calls, understands every conversation, and
            delivers instant summaries, action items, and AI insights — so your
            team always knows exactly what to do next.
          </p>

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

          {/* Hero visual — mock AI chat card */}
          <div
            data-reveal
            data-reveal-delay='300'
            style={{
              marginTop: '80px',
              display: 'inline-block',
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
              <div
                style={{ display: 'flex', gap: '7px', marginBottom: '20px' }}
              >
                {['#ff5f57', '#ffbd2e', '#28c840'].map((c) => {
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
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {[
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
                ].map((msg, i) => {
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        flexDirection:
                          msg.role === 'user' ? 'row-reverse' : 'row',
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

        {/* ── Stats bar ────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '44px 40px',
            background: 'rgba(255,255,255,0.018)',
          }}
        >
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '32px',
              textAlign: 'center',
            }}
          >
            {STATS.map((s, i) => {
              return (
                <div
                  key={s.number}
                  data-reveal
                  data-reveal-delay={String(i * 80)}
                >
                  <div
                    style={{
                      fontSize: '38px',
                      fontWeight: 900,
                      letterSpacing: '-0.03em',
                      background: 'linear-gradient(135deg, #c4b5fd, #67e8f9)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      lineHeight: 1.1,
                    }}
                  >
                    {s.number}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.4)',
                      marginTop: '6px',
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Features ─────────────────────────────────────────────── */}
        <section
          id='features'
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '100px 40px',
            maxWidth: '1120px',
            margin: '0 auto',
          }}
        >
          <div
            data-reveal
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
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
              Features
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
              Everything your team needs
              <br />
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                from every meeting
              </span>
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
              gap: '20px',
            }}
          >
            {FEATURES.map((f, i) => {
              return (
                <div
                  key={f.title}
                  className='tribes-card'
                  data-reveal
                  data-reveal-delay={String(i * 70)}
                  style={{
                    background: 'rgba(255,255,255,0.028)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px',
                    padding: '28px',
                  }}
                >
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '13px',
                      background: f.accent + '25',
                      border: `1px solid ${f.accent}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      marginBottom: '18px',
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      color: 'white',
                      marginBottom: '9px',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.48)',
                      lineHeight: 1.75,
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────── */}
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
            <div
              data-reveal
              style={{ textAlign: 'center', marginBottom: '64px' }}
            >
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

        {/* ── AI Artifacts ─────────────────────────────────────────── */}
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
          <div
            data-reveal
            style={{ textAlign: 'center', marginBottom: '56px' }}
          >
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

        {/* ── Integrations ─────────────────────────────────────────── */}
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

        {/* ── Methodology ──────────────────────────────────────────── */}
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
                {[
                  'Custom summary templates per meeting type',
                  'Team-specific action item formats',
                  'Reusable methodology library',
                  'Per-team methodology assignment',
                ].map((item) => {
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
              {[
                {
                  name: 'Sprint Retrospective',
                  tag: 'Engineering',
                  color: '#7c3aed',
                },
                { name: 'Weekly 1-on-1', tag: 'HR', color: '#0891b2' },
                { name: 'OKR Review', tag: 'Leadership', color: '#059669' },
                { name: 'Product Roadmap', tag: 'Product', color: '#d97706' },
              ].map((m) => {
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

        {/* ── CTA ──────────────────────────────────────────────────── */}
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

        {/* ── Footer ───────────────────────────────────────────────── */}
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
            {[
              { href: '#features', label: 'Features' },
              { href: '#how-it-works', label: 'How it works' },
              { href: '/auth/register', label: 'Register' },
              { href: '/auth/login', label: 'Sign In' },
            ].map((link) => {
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
      </div>
    </>
  );
}
