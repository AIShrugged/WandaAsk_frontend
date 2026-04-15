import { Inter } from 'next/font/google';
import { PublicEnvScript } from 'next-runtime-env';

import { APP_NAME } from '@/shared/lib/app-name';

import './globals.css';

import Providers from './Providers';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const getFont = Inter({
  variable: '--font-inter-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Tribes App',
};

/**
 * RootLayout component.
 * @param root0
 * @param root0.children
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <PublicEnvScript />
      </head>
      <body className={`${getFont.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
