import { Badge } from '@/shared/ui/badge/Badge';

import {
  TONE_TO_BADGE_VARIANT,
  type TabStatus,
} from '../../model/dashboard-types';

import TeamDashboardTaskRow from './team-dashboard-task-row';

interface TeamDashboardTabStatusProps {
  data: TabStatus;
}

/**
 * TeamDashboardTabStatus — renders task sections grouped by status tone.
 * @param props - Component props.
 * @param props.data
 */
export default function TeamDashboardTabStatus({
  data,
}: TeamDashboardTabStatusProps) {
  if (data.sections.length === 0) {
    return (
      <p className='text-sm text-muted-foreground text-center py-10'>
        No status data available
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      {data.sections.map((section) => {
        return (
          <div key={section.key}>
            <div className='flex items-center gap-2 mb-3'>
              <span className='text-sm font-semibold text-foreground'>
                {section.label}
              </span>
              <Badge variant={TONE_TO_BADGE_VARIANT[section.tone]}>
                {section.count}
              </Badge>
            </div>
            {section.items.length > 0 ? (
              <div>
                {section.items.map((task) => {
                  return <TeamDashboardTaskRow key={task.id} task={task} />;
                })}
              </div>
            ) : (
              <p className='text-xs text-muted-foreground py-2'>No items</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
