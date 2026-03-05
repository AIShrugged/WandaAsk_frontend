import type { TeamProps } from '@/entities/team';

/**
 * initials.
 * @param name - name.
 * @returns Result.
 */
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

/**
 * avatarColor.
 * @param name - name.
 * @returns Result.
 */
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.codePointAt(i)!) % AVATAR_COLORS.length;
  }

  return AVATAR_COLORS[hash];
}

/**
 * TeamMembers component.
 * @param props - Component props.
 * @param props.data
 */
export default function TeamMembers({ data }: { data: TeamProps }) {
  const members = data.members ?? [];

  if (members.length === 0) {
    return (
      <p className='text-sm text-muted-foreground text-center py-10'>
        No members yet
      </p>
    );
  }

  return (
    <div className='grid gap-4 grid-cols-1 phone:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 pt-6 pb-10 px-6'>
      {members.map((member) => {
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
          </div>
        );
      })}
    </div>
  );
}
