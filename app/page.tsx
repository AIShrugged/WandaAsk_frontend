import {
  LandingArtifacts,
  LandingBackground,
  LandingCta,
  LandingFeatures,
  LandingFooter,
  LandingHero,
  LandingHowItWorks,
  LandingIntegrations,
  LandingMethodology,
  LandingNav,
  LandingStats,
  LandingStyles,
  PixelRobot,
  ScrollReveal,
} from '@/features/landing';

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

/**
 * Home page component.
 * @returns JSX element.
 */
export default function Home() {
  return (
    <>
      <LandingStyles />
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
        <LandingBackground />
        <LandingNav />
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingArtifacts />
        <LandingIntegrations />
        <LandingMethodology />
        <LandingCta />
        <LandingFooter />
      </div>
    </>
  );
}
