import { format, parseISO } from 'date-fns';

import { Badge } from '@/shared/ui/badge/Badge';

import {
  TONE_TO_BADGE_VARIANT,
  type DecisionItem,
  type DashboardTaskCard,
  type StatusSection,
} from '../../model/dashboard-types';

import TeamDashboardTaskRow from './team-dashboard-task-row';

interface SectionHeaderProps {
  title: string;
  count?: number;
}

function SectionHeader({ title, count }: SectionHeaderProps) {
  return (
    <div className='flex items-center gap-2 mb-3'>
      <span className='text-sm font-semibold text-foreground'>{title}</span>
      {count !== undefined && (
        <Badge variant='default'>{count}</Badge>
      )}
    </div>
  );
}

function SinceLastWeekSection({ sections }: { sections: StatusSection[] }) {
  if (sections.length === 0) return null;

  return (
    <div>
      <SectionHeader
        title='Since Last Week'
        count={sections.reduce((acc, s) => {return acc + s.count}, 0)}
      />
      {sections.map((section) => {return (
        <div key={section.key} className='mb-4'>
          <div className='flex items-center gap-2 mb-2'>
            <Badge variant={TONE_TO_BADGE_VARIANT[section.tone]}>
              {section.label}
            </Badge>
            <span className='text-xs text-muted-foreground'>
              {section.count}
            </span>
          </div>
          {section.items.map((task) => {return (
            <TeamDashboardTaskRow key={task.id} task={task} />
          )})}
        </div>
      )})}
    </div>
  );
}

function DeadlinesSection({ items }: { items: DashboardTaskCard[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <SectionHeader title='Deadlines & Priorities' count={items.length} />
      {items.map((task) => {return (
        <TeamDashboardTaskRow key={task.id} task={task} />
      )})}
    </div>
  );
}

function DecisionsSection({ items }: { items: DecisionItem[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <SectionHeader title='Decisions Needed' count={items.length} />
      <div className='flex flex-col'>
        {items.map((item, i) => {return (
          <div
            key={item.id}
            className={`py-3 ${i < items.length - 1 ? 'border-b border-border/50' : ''}`}
          >
            <p className='text-sm font-medium text-foreground'>{item.title}</p>
            <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap'>
              <span>{item.subtitle}</span>
              <span>{format(parseISO(item.meeting_date), 'MMM d')}</span>
              <Badge variant='default'>{item.source}</Badge>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}

interface TeamDashboardSectionsProps {
  sections: {
    since_last_week: StatusSection[];
    deadlines_and_priorities: DashboardTaskCard[];
    decisions_needed: DecisionItem[];
  };
}

/**
 * TeamDashboardSections — always-visible sections below tabs.
 * @param props - Component props.
 * @param props.sections
 */
export default function TeamDashboardSections({
  sections,
}: TeamDashboardSectionsProps) {
  const hasContent =
    sections.since_last_week.length > 0 ||
    sections.deadlines_and_priorities.length > 0 ||
    sections.decisions_needed.length > 0;

  if (!hasContent) return null;

  return (
    <div className='flex flex-col gap-8'>
      <SinceLastWeekSection sections={sections.since_last_week} />
      <DeadlinesSection items={sections.deadlines_and_priorities} />
      <DecisionsSection items={sections.decisions_needed} />
    </div>
  );
}
