import Link from 'next/link';

/**
 *
 * @param root0
 * @param root0.baseHref
 * @param root0.currentTab
 * @param root0.tabs
 */
export function AgentPageTabs({
  baseHref,
  currentTab,
  tabs,
}: {
  baseHref: string;
  currentTab: string;
  tabs: Array<{ key: string; label: string }>;
}) {
  return (
    <div className='flex overflow-x-auto'>
      {tabs.map((tab, index) => {
        const isActive = tab.key === currentTab;

        const href =
          tab.key === tabs[0]?.key ? baseHref : `${baseHref}?tab=${tab.key}`;

        return (
          <Link
            key={tab.key}
            href={href}
            className={`flex-shrink-0 border border-border px-3 py-1.5 text-sm transition-all ${
              isActive
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-accent'
            } ${index === 0 ? 'rounded-l-[var(--radius-button)]' : ''} ${
              index === tabs.length - 1
                ? 'rounded-r-[var(--radius-button)]'
                : ''
            } ${index > 0 ? '-ml-px' : ''}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
