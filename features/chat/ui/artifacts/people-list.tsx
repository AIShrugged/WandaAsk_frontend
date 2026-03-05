import type { PeopleListArtifact } from '@/features/chat/types';

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

/**
 * PeopleList component.
 * @param props - Component props.
 * @param props.data
 */
export function PeopleList({ data }: { data: PeopleListArtifact['data'] }) {
  const members = data.members ?? [];

  if (members.length === 0) {
    return (
      <p className='text-sm text-muted-foreground text-center py-6'>
        No members
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      {members.map((member) => {
        return (
          <div
            key={member.user_id}
            className='flex items-center gap-3 p-2 rounded-[var(--radius-button)] hover:bg-accent/40 transition-colors'
          >
            <div
              className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${avatarColor(member.name)}`}
            >
              {initials(member.name)}
            </div>
            <div className='min-w-0'>
              <p className='text-sm font-medium text-foreground truncate'>
                {member.name}
              </p>
              <p className='text-xs text-muted-foreground truncate'>
                {member.role}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
