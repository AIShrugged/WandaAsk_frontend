import { LandingArtifacts } from '@/features/landing/ui/LandingArtifacts';
import { LandingBackground } from '@/features/landing/ui/LandingBackground';
import { LandingCta } from '@/features/landing/ui/LandingCta';
import { LandingFeatures } from '@/features/landing/ui/LandingFeatures';
import { LandingFooter } from '@/features/landing/ui/LandingFooter';
import { LandingHero } from '@/features/landing/ui/LandingHero';
import { LandingHowItWorks } from '@/features/landing/ui/LandingHowItWorks';
import { LandingIntegrations } from '@/features/landing/ui/LandingIntegrations';
import { LandingMethodology } from '@/features/landing/ui/LandingMethodology';
import { LandingNav } from '@/features/landing/ui/LandingNav';
import { LandingStats } from '@/features/landing/ui/LandingStats';
import { LandingStyles } from '@/features/landing/ui/LandingStyles';
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

/**
 *
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
