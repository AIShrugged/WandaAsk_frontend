'use client';

import { UserMinus, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { kickTeamMember } from '@/features/teams/api/team';
import TeamMemberAddModal from '@/features/teams/ui/team-member-add-modal';
import TeamNotificationSettings from '@/features/teams/ui/team-notification-settings';
import { useModal } from '@/shared/hooks/use-modal';

import type { TelegramChatRegistration } from '@/features/chat/types';
import type { TeamNotificationSetting } from '@/features/teams/model/types';

interface TeamMember {
  id: number;
  name: string;
  email: string;
}

interface MemberCardProps {
  member: TeamMember;
  teamId: number;
}

/**
 * initials — generate avatar initials from a name.
 * @param name - Full name.
 * @returns Initials string.
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
 * avatarColor — deterministic color from name hash.
 * @param name - Member name.
 * @returns Tailwind bg class.
 */
function avatarColor(name: string): string {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.codePointAt(i)!) % AVATAR_COLORS.length;
  }

  return AVATAR_COLORS[hash];
}

/**
 * MemberCard — displays a team member with a remove action.
 * @param props - Component props.
 * @param props.member
 * @param props.teamId
 */
function MemberCard({ member, teamId }: MemberCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result = await kickTeamMember(teamId, member.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${member.name} removed from team`);
        router.refresh();
      }
    });
  };

  return (
    <div className='flex items-center gap-3 p-4 rounded-[var(--radius-card)] border border-border bg-card'>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor(member.name)}`}
      >
        {initials(member.name)}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-foreground truncate'>
          {member.name}
        </p>
        <p className='text-xs text-muted-foreground truncate'>{member.email}</p>
      </div>
      <button
        type='button'
        onClick={handleRemove}
        disabled={isPending}
        aria-label={`Remove ${member.name}`}
        className='flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <UserMinus className='size-4' />
      </button>
    </div>
  );
}

interface TeamDashboardTabSettingsProps {
  teamId: number;
  members: TeamMember[];
  settings: TeamNotificationSetting[];
  availableChats: TelegramChatRegistration[];
}

/**
 * TeamDashboardTabSettings — Settings tab with member management and notifications.
 * @param props - Component props.
 * @param props.teamId
 * @param props.members
 * @param props.settings
 * @param props.availableChats
 */
export default function TeamDashboardTabSettings({
  teamId,
  members,
  settings,
  availableChats,
}: TeamDashboardTabSettingsProps) {
  const { open, close } = useModal();

  const handleInvite = () => {
    open?.(<TeamMemberAddModal close={close} />);
  };

  return (
    <div className='flex flex-col gap-8'>
      {/* Members section */}
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold text-foreground'>Members</h3>
          <button
            type='button'
            onClick={handleInvite}
            className='inline-flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-400 transition-colors'
          >
            <UserPlus className='size-4' />
            Invite
          </button>
        </div>

        {members.length === 0 ? (
          <p className='text-sm text-muted-foreground text-center py-6'>
            No members yet. Invite someone to get started.
          </p>
        ) : (
          <div className='grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
            {members.map((member) => {
              return (
                <MemberCard key={member.id} member={member} teamId={teamId} />
              );
            })}
          </div>
        )}
      </div>

      {/* Notifications section */}
      <TeamNotificationSettings
        teamId={teamId}
        settings={settings}
        availableChats={availableChats}
      />
    </div>
  );
}
