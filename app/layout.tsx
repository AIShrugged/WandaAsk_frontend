import { cookies } from 'next/headers';
import { PublicEnvScript } from 'next-runtime-env';

import type { Theme } from '@/entities/user';

import { APP_NAME } from '@/shared/lib/app-name';

import './globals.css';

import { instrumentSerif, inter, jetbrainsMono } from './fonts';
import Providers from './Providers';

import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Tribes App',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const cookieStore = await cookies();
  const rawTheme = cookieStore.get('tribes-theme')?.value;
  const theme: Theme =
    rawTheme === 'light' || rawTheme === 'dark' ? rawTheme : 'dark';

  return (
    <html
      lang='en'
      data-theme={theme}
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <PublicEnvScript />
      </head>
      <body className='antialiased'>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
