'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export interface PageTab {
  /** Canonical href for this tab (full path, no query string). */
  href: string;
  label: string;
  /**
   * Match strategy.
   * - 'startsWith' (default): active when pathname starts with href
   * - 'exact': active only when pathname exactly equals href
   */
  match?: 'startsWith' | 'exact';
}

interface Props {
  tabs: readonly PageTab[];
  /**
   * When true, current URL search params are appended to every tab href.
   * Use for sections where filter params must survive tab switches (e.g. Issues).
   */
  preserveSearchParams?: boolean;
  className?: string;
  /**
   * Visual variant:
   * - 'underline' (default): bottom border active indicator
   * - 'segmented': pill/button group style for in-page detail views
   */
  variant?: 'underline' | 'segmented';
}

export function PageTabsNav({
  tabs,
  preserveSearchParams = false,
  className,
  variant = 'underline',
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = searchParams.toString();

  if (variant === 'segmented') {
    return (
      <div
        className={['flex overflow-x-auto', className]
          .filter(Boolean)
          .join(' ')}
      >
        {tabs.map((tab, index) => {
          const isActive =
            tab.match === 'exact'
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
          const href =
            preserveSearchParams && params ? `${tab.href}?${params}` : tab.href;

          return (
            <Link
              key={tab.href}
              href={href}
              scroll={false}
              className={[
                'flex-shrink-0 border border-border px-3 py-1.5 text-sm transition-all',
                isActive
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-accent',
                index === 0 ? 'rounded-l-[var(--radius-button)]' : '',
                index === tabs.length - 1
                  ? 'rounded-r-[var(--radius-button)]'
                  : '',
                index > 0 ? '-ml-px' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={['flex gap-1 border-b border-border', className]
        .filter(Boolean)
        .join(' ')}
    >
      {tabs.map((tab) => {
        const isActive =
          tab.match === 'exact'
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
        const href =
          preserveSearchParams && params ? `${tab.href}?${params}` : tab.href;

        return (
          <Link
            key={tab.href}
            href={href}
            scroll={false}
            className={[
              'cursor-pointer px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
