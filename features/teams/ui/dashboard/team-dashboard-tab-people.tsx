'use client';

import { UserMinus, UserPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { cancelTeamInvite, kickTeamMember } from '@/features/teams/api/team';
import { avatarColor, initials } from '@/features/teams/model/avatar-utils';
import TeamMemberAddModal from '@/features/teams/ui/team-member-add-modal';
import TeamNotificationSettings from '@/features/teams/ui/team-notification-settings';
import { useModal } from '@/shared/hooks/use-modal';

import type { TeamInvite, TeamProps } from '@/entities/team';
import type { TelegramChatRegistration } from '@/features/chat/types';
import type {
  PersonMember,
  TabPeople,
} from '@/features/teams/model/dashboard-types';
import type { TeamNotificationSetting } from '@/features/teams/model/types';

// ─── Member row ───────────────────────────────────────────────────────────────

interface MemberRowProps {
  member: TeamProps['members'][number];
  analytics: PersonMember | null;
  teamId: number;
  isManager: boolean;
}

function MemberRow({ member, analytics, teamId, isManager }: MemberRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { open, close } = useModal();

  const handleRemove = () => {
    open?.(
      <div className='flex flex-col gap-4 p-4'>
        <p className='text-sm text-foreground'>
          Remove <span className='font-semibold'>{member.name}</span> from the
          team?
        </p>
        <div className='flex justify-end gap-2'>
          <button
            type='button'
            onClick={close}
            className='px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={() => {
              close?.();
              startTransition(async () => {
                const result = await kickTeamMember(teamId, member.id);

                if (result.error) {
                  toast.error(result.error);
                } else {
                  toast.success(`${member.name} removed from team`);
                  router.refresh();
                }
              });
            }}
            className='px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors'
          >
            Remove
          </button>
        </div>
      </div>,
    );
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

        {analytics && (
          <div className='flex items-center gap-3 mt-1 text-xs'>
            <span className='text-muted-foreground'>
              <span className='text-foreground font-medium'>
                {analytics.done_tasks}
              </span>{' '}
              done
            </span>
            <span className='text-muted-foreground'>
              <span className='text-foreground font-medium'>
                {analytics.open_tasks}
              </span>{' '}
              open
            </span>
            {analytics.overdue_tasks > 0 && (
              <span className='text-red-400 font-medium'>
                {analytics.overdue_tasks} overdue
              </span>
            )}
            {analytics.latest_meeting && (
              <span className='text-muted-foreground truncate max-w-[120px]'>
                {analytics.latest_meeting.title}
              </span>
            )}
          </div>
        )}
      </div>

      {isManager && (
        <button
          type='button'
          onClick={handleRemove}
          disabled={isPending}
          aria-label={`Remove ${member.name}`}
          className='flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <UserMinus className='size-4' />
        </button>
      )}
    </div>
  );
}

// ─── Pending invite row ───────────────────────────────────────────────────────

interface PendingInviteRowProps {
  invite: TeamInvite;
  teamId: number;
}

function PendingInviteRow({ invite, teamId }: PendingInviteRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelTeamInvite(teamId, invite.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Invitation cancelled');
        router.refresh();
      }
    });
  };

  const expiresLabel = invite.expires_at
    ? new Date(invite.expires_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className='flex items-center gap-3 p-3 rounded-[var(--radius-card)] border border-border bg-card/50'>
      <div className='flex-1 min-w-0'>
        <p className='text-sm text-foreground truncate'>{invite.email}</p>
        {expiresLabel && (
          <p className='text-xs text-muted-foreground mt-0.5'>
            Expires {expiresLabel}
          </p>
        )}
      </div>

      <span className='text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 flex-shrink-0'>
        Pending
      </span>

      <button
        type='button'
        onClick={handleCancel}
        disabled={isPending}
        aria-label={`Cancel invite for ${invite.email}`}
        className='flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <X className='size-4' />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TeamDashboardTabPeopleProps {
  analyticsData: TabPeople | null;
  members: TeamProps['members'];
  pendingInvites: TeamInvite[];
  teamId: number;
  isManager: boolean;
  settings: TeamNotificationSetting[];
  availableChats: TelegramChatRegistration[];
}

/**
 * TeamDashboardTabPeople — unified People tab.
 * Shows member list with analytics, pending invites (manager-only), and
 * notification settings (manager-only).
 */
export default function TeamDashboardTabPeople({
  analyticsData,
  members,
  pendingInvites,
  teamId,
  isManager,
  settings,
  availableChats,
}: TeamDashboardTabPeopleProps) {
  const { open, close } = useModal();

  const analyticsMap = new Map<number, PersonMember>(
    (analyticsData?.members ?? []).map((m) => {
      return [m.id, m];
    }),
  );

  const handleInvite = () => {
    open?.(<TeamMemberAddModal close={close} />);
  };

  return (
    <div className='flex flex-col gap-8'>
      {/* Members section */}
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold text-foreground'>Members</h3>
          {isManager && (
            <button
              type='button'
              onClick={handleInvite}
              className='inline-flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-400 transition-colors'
            >
              <UserPlus className='size-4' />
              Invite
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <p className='text-sm text-muted-foreground text-center py-6'>
            No members yet.{' '}
            {isManager && (
              <button
                type='button'
                onClick={handleInvite}
                className='text-violet-500 hover:text-violet-400 transition-colors'
              >
                Invite someone to get started.
              </button>
            )}
          </p>
        ) : (
          <div className='grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
            {members.map((member) => {
              return (
                <MemberRow
                  key={member.id}
                  member={member}
                  analytics={analyticsMap.get(member.id) ?? null}
                  teamId={teamId}
                  isManager={isManager}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Pending invites section (manager-only, hidden when empty) */}
      {isManager && pendingInvites.length > 0 && (
        <div className='flex flex-col gap-3'>
          <h3 className='text-sm font-semibold text-foreground'>
            Pending Invites
          </h3>
          <div className='flex flex-col gap-2'>
            {pendingInvites.map((invite) => {
              return (
                <PendingInviteRow
                  key={invite.id}
                  invite={invite}
                  teamId={teamId}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Notification settings (manager-only) */}
      {isManager && (
        <TeamNotificationSettings
          teamId={teamId}
          settings={settings}
          availableChats={availableChats}
        />
      )}
    </div>
  );
}
