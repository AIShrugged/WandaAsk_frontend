import { Instrument_Serif, Inter, JetBrains_Mono } from 'next/font/google';

export const inter = Inter({
  variable: '--font-inter-sans',
  subsets: ['latin'],
  display: 'swap',
});

// Instrument Serif is not a variable font — weight 400 only.
// Load italic style only: used exclusively for decorative display text
// (dashboard greeting, auth quote). Loading both styles doubles the
// font payload for no benefit.
export const instrumentSerif = Instrument_Serif({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  style: ['italic'],
  display: 'swap',
});

// Non-critical path — system mono is an acceptable fallback for timestamps
// and code spans. 'optional' skips loading if the network is slow.
export const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'optional',
});
