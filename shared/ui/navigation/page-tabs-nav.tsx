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
   * - 'underline' (default): pseudo-element active indicator, no layout shift
   * - 'segmented': pill/button group inside a surface-3 container
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
      // Surface-3 pill container — TRIBES segmented tab pattern
      <div
        className={[
          'inline-flex rounded-[var(--r-lg)] bg-[var(--surface-3)] p-[3px] gap-0.5',
          className,
        ]
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
                'flex-shrink-0 rounded-[calc(var(--r-lg)-3px)] px-3 py-1.5 text-sm font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                isActive
                  ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
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

  // Underline variant: bottom border on container, active tab uses absolute
  // pseudo-element indicator — zero layout shift vs border-b-2 on the link.
  return (
    <div
      className={['flex gap-1 border-b border-[var(--divider)]', className]
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
              'relative cursor-pointer px-4 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:rounded-[var(--r-sm)]',
              // Active indicator: absolute 2px bar at the bottom via after:
              isActive
                ? 'text-[var(--primary)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-[var(--primary)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            ].join(' ')}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
