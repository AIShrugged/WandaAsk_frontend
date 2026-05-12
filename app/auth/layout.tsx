import type { PropsWithChildren } from 'react';

/**
 * Layout component.
 * @param props - Component props.
 * @param props.children
 */
export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className='min-h-screen w-full bg-[var(--background)]'>
      {/* Two-column auth-stage: quote left | card right (hides quote on mobile) */}
      <div className='grid min-h-screen lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_560px]'>
        {/* Left — display quote, hidden below lg */}
        <div className='hidden lg:flex flex-col justify-center px-16 xl:px-24 border-r border-[var(--border)]'>
          <blockquote
            className='text-3xl xl:text-4xl leading-snug text-[var(--foreground)]'
            style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
          >
            &ldquo;The most valuable asset of any organisation is the trust
            between its people.&rdquo;
          </blockquote>
          <p className='mt-6 text-[length:var(--fs-sm)] text-[var(--muted-foreground)]'>
            AI Ask Wanda — HR intelligence platform
          </p>
        </div>

        {/* Right — auth card */}
        <div className='flex items-center justify-center px-4 py-12 lg:px-12 bg-[var(--surface)]'>
          <div className='w-full max-w-sm'>{children}</div>
        </div>
      </div>
    </div>
  );
}
