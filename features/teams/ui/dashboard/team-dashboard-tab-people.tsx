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
import { BUTTON_SIZE, BUTTON_VARIANT } from '@/shared/types/button';
import { Button, ButtonIcon } from '@/shared/ui/button';
import Avatar from '@/shared/ui/common/avatar';

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
          <Button
            size={BUTTON_SIZE.sm}
            variant={BUTTON_VARIANT.ghost}
            fullWidth={false}
            onClick={close}
          >
            Cancel
          </Button>
          <Button
            size={BUTTON_SIZE.sm}
            variant={BUTTON_VARIANT.danger}
            fullWidth={false}
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
          >
            Remove
          </Button>
        </div>
      </div>,
    );
  };

  return (
    <div className='flex items-center gap-3 p-4 rounded-[var(--radius-card)] border border-border bg-card'>
      <Avatar
        size='sm'
        className={`text-xs font-bold text-white ${avatarColor(member.name)}`}
      >
        {initials(member.name)}
      </Avatar>

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
        <ButtonIcon
          aria-label={`Remove ${member.name}`}
          icon={<UserMinus className='size-4' />}
          variant='danger'
          size='sm'
          disabled={isPending}
          onClickAction={handleRemove}
          className='flex-shrink-0'
        />
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

      <ButtonIcon
        aria-label={`Cancel invite for ${invite.email}`}
        icon={<X className='size-4' />}
        variant='danger'
        size='sm'
        disabled={isPending}
        onClickAction={handleCancel}
        className='flex-shrink-0'
      />
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
            <Button
              size={BUTTON_SIZE.xs}
              variant={BUTTON_VARIANT.ghost}
              fullWidth={false}
              leftIcon={<UserPlus className='size-4' />}
              onClick={handleInvite}
              className='text-violet-500 hover:text-violet-400'
            >
              Invite
            </Button>
          )}
        </div>

        {members.length === 0 ? (
          <p className='text-sm text-muted-foreground text-center py-6'>
            No members yet.{' '}
            {isManager && (
              <Button
                size={BUTTON_SIZE.xs}
                variant={BUTTON_VARIANT.ghost}
                fullWidth={false}
                onClick={handleInvite}
                className='inline text-violet-500 hover:text-violet-400'
              >
                Invite someone to get started.
              </Button>
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
