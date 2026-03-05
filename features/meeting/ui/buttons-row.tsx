import { available_tabs } from '@/features/meeting/lib/options';
import { TabLink } from '@/features/meeting/ui/TabLink';

interface Props {
  currentTab: string | undefined;
}

const items = [
  {
    title: 'Overview',
    link: available_tabs.summary,
  },
  {
    title: 'Follow-up',
    link: available_tabs.followup,
  },
  {
    title: 'Transcript',
    link: available_tabs.transcript,
  },
  {
    title: 'Analysis',
    link: available_tabs.analysis,
  },
];

/**
 * ButtonsRow component.
 * @param props - Component props.
 * @param props.currentTab
 */
export default function ButtonsRow({ currentTab }: Props) {
  return items.map((item, index) => {
    const isActive = item.link === currentTab;

    return (
      <TabLink key={index} tab={item.link}>
        <button
          className={`border border-border cursor-pointer px-3 py-1.5 text-center text-sm transition-all
  ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'}
  ${index === 0 ? 'rounded-l-[var(--radius-button)]' : ''}
  ${index === items.length - 1 ? 'rounded-r-[var(--radius-button)]' : ''}
  ${index > 0 ? '-ml-px' : ''}`}
          type='button'
        >
          <p
            className={isActive ? 'text-primary-foreground' : 'text-foreground'}
          >
            {item.title}
          </p>
        </button>
      </TabLink>
    );
  });
}
