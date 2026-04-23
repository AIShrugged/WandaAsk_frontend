import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { PublicEnvScript } from 'next-runtime-env';

import type { Theme } from '@/entities/user';

import { APP_NAME } from '@/shared/lib/app-name';

import './globals.css';

import Providers from './Providers';

import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

const getFont = Inter({
  variable: '--font-inter-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Tribes App',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get('wanda-theme')?.value ?? 'dark') as Theme;

  return (
    <html lang='en' data-theme={theme}>
      <head>
        <PublicEnvScript />
      </head>
      <body className={`${getFont.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
