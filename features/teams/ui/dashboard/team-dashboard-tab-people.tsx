import type { TabPeople } from '../../model/dashboard-types';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-pink-500',
];

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => {
      return w[0];
    })
    .join('')
    .toUpperCase();
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.codePointAt(i)!) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
}

interface TeamDashboardTabPeopleProps {
  data: TabPeople;
}

/**
 * TeamDashboardTabPeople — member cards with task stats.
 * @param props - Component props.
 * @param props.data
 */
export default function TeamDashboardTabPeople({
  data,
}: TeamDashboardTabPeopleProps) {
  if (data.members.length === 0) {
    return (
      <p className='text-sm text-muted-foreground text-center py-10'>
        No members found
      </p>
    );
  }

  return (
    <div className='grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
      {data.members.map((member) => {
        return (
          <div
            key={member.id}
            className='flex flex-col items-center gap-3 p-4 rounded-[var(--radius-card)] border border-border bg-card hover:shadow-card transition-shadow'
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${avatarColor(member.name)}`}
            >
              {initials(member.name)}
            </div>
            <div className='text-center min-w-0 w-full'>
              <p className='text-sm font-semibold text-foreground truncate'>
                {member.name}
              </p>
              <p className='text-xs text-muted-foreground truncate mt-0.5'>
                {member.email}
              </p>
            </div>
            <div className='flex items-center justify-center gap-3 text-xs w-full'>
              <span className='text-muted-foreground'>
                <span className='text-foreground font-medium'>
                  {member.done_tasks}
                </span>{' '}
                done
              </span>
              <span className='text-muted-foreground'>
                <span className='text-foreground font-medium'>
                  {member.open_tasks}
                </span>{' '}
                open
              </span>
              {member.overdue_tasks > 0 && (
                <span className='text-red-400 font-medium'>
                  {member.overdue_tasks} overdue
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
