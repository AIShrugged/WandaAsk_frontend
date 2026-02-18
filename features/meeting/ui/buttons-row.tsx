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

export default function ButtonsRow({ currentTab }: Props) {
  return items.map((item, index) => {
    const isActive = item.link === currentTab;

    return (
      <TabLink key={index} tab={item.link}>
        <button
          className={`border-table border-1 cursor-pointer px-2.5 p-2 text-center text-sm  transition-all
  ${isActive ? 'bg-primary text-white' : ''}
  ${index === 0 ? 'rounded-l-full ' : ''}
  ${index === items.length - 1 ? 'rounded-r-full' : ''}
  ${index > 0 && index < items.length - 1 ? 'border-l border-r ' : ''}`}
          type='button'
        >
          <p className={isActive ? 'text-white' : 'text-accent'}>
            {item.title}
          </p>
        </button>
      </TabLink>
    );
  });
}
