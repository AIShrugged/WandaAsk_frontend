'use client';

import { Bell, Plus, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  createTeamNotificationSetting,
  deleteTeamNotificationSetting,
  updateTeamNotificationSetting,
} from '@/features/teams/api/notification-settings';
import { useModal } from '@/shared/hooks/use-modal';
import { Button } from '@/shared/ui/button/Button';
import ModalBody from '@/shared/ui/modal/modal-body';
import ModalFooter from '@/shared/ui/modal/modal-footer';
import ModalHeader from '@/shared/ui/modal/modal-header';

import type { TeamNotificationSetting } from '@/features/teams/model/types';
import type { TelegramChatRegistration } from '@/features/chat/types';
import type { ModalContextValue } from '@/shared/types/modal';

// ─── Event type labels ────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  meeting_summary: 'Meeting summary',
};

// ─── Add modal ────────────────────────────────────────────────────────────────

interface AddModalProps extends ModalContextValue {
  teamId: number;
  availableChats: TelegramChatRegistration[];
}

function AddNotificationModal({ close, teamId, availableChats }: AddModalProps) {
  const [selectedChatId, setSelectedChatId] = useState<string>(
    availableChats[0] ? String(availableChats[0].id) : '',
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!selectedChatId) return;

    startTransition(async () => {
      const result = await createTeamNotificationSetting(teamId, {
        event_type: 'meeting_summary',
        channel_type: 'telegram',
        telegram_chat_registration_id: Number(selectedChatId),
        enabled: true,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Notification setting added');
        close();
      }
    });
  };

  return (
    <>
      <ModalHeader onClick={close} title='Add notification' />
      <ModalBody>
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col gap-1.5'>
            <p className='text-sm text-muted-foreground'>Event</p>
            <p className='text-sm font-medium text-foreground'>Meeting summary</p>
          </div>

          <div className='flex flex-col gap-1.5'>
            <p className='text-sm text-muted-foreground'>Channel</p>
            <p className='text-sm font-medium text-foreground'>Telegram</p>
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-sm text-muted-foreground' htmlFor='chat-select'>
              Telegram chat
            </label>
            {availableChats.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                No chats linked to this team. Link a chat via{' '}
                <span className='font-medium'>Chat → Telegram</span>.
              </p>
            ) : (
              <select
                id='chat-select'
                value={selectedChatId}
                onChange={(e) => setSelectedChatId(e.target.value)}
                className='w-full h-10 px-3 rounded-[var(--radius-button)] border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
              >
                {availableChats.map((chat) => (
                  <option key={chat.id} value={String(chat.id)}>
                    {chat.chat_title ?? `Chat #${chat.id}`}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <div className='flex gap-3'>
          <Button
            variant='secondary'
            onClick={close}
            disabled={isPending}
            type='button'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !selectedChatId || availableChats.length === 0}
            loading={isPending}
            loadingText='Saving...'
            type='button'
          >
            Add
          </Button>
        </div>
      </ModalFooter>
    </>
  );
}

// ─── Setting row ──────────────────────────────────────────────────────────────

interface SettingRowProps {
  setting: TeamNotificationSetting;
  teamId: number;
}

function SettingRow({ setting, teamId }: SettingRowProps) {
  const [isPending, startTransition] = useTransition();

  const chatTitle =
    setting.notifiable?.data?.chat_title ?? `Chat #${setting.notifiable?.id}`;

  const eventLabel = EVENT_TYPE_LABELS[setting.event_type] ?? setting.event_type;

  const handleToggle = () => {
    startTransition(async () => {
      const result = await updateTeamNotificationSetting(
        teamId,
        setting.id,
        !setting.enabled,
      );

      if (result.error) toast.error(result.error);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTeamNotificationSetting(teamId, setting.id);

      if (result.error) toast.error(result.error);
      else toast.success('Notification setting removed');
    });
  };

  return (
    <div className='flex items-center justify-between gap-4 px-4 py-3 rounded-[var(--radius-card)] border border-border bg-card'>
      <div className='flex items-center gap-3 min-w-0'>
        <Bell className='size-4 text-muted-foreground flex-shrink-0' />
        <div className='min-w-0'>
          <p className='text-sm font-medium text-foreground truncate'>{eventLabel}</p>
          <p className='text-xs text-muted-foreground truncate'>
            Telegram · {chatTitle}
          </p>
        </div>
      </div>

      <div className='flex items-center gap-3 flex-shrink-0'>
        {/* Toggle */}
        <button
          type='button'
          onClick={handleToggle}
          disabled={isPending}
          aria-label={setting.enabled ? 'Disable' : 'Enable'}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            setting.enabled ? 'bg-violet-600' : 'bg-muted'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
              setting.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>

        {/* Delete */}
        <button
          type='button'
          onClick={handleDelete}
          disabled={isPending}
          aria-label='Delete'
          className='text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <Trash2 className='size-4' />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  teamId: number;
  settings: TeamNotificationSetting[];
  availableChats: TelegramChatRegistration[];
}

export default function TeamNotificationSettings({
  teamId,
  settings,
  availableChats,
}: Props) {
  const { open, close } = useModal();

  const handleAdd = () => {
    open(
      <AddNotificationModal
        close={close}
        teamId={teamId}
        availableChats={availableChats}
      />,
    );
  };

  return (
    <div className='px-6 pb-10'>
      <div className='flex items-center justify-between mb-4 pt-2'>
        <div className='flex items-center gap-2'>
          <div className='h-px flex-1 bg-border w-4' />
          <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider'>
            Notifications
          </h3>
          <div className='h-px flex-1 bg-border w-4' />
        </div>
        <button
          type='button'
          onClick={handleAdd}
          className='flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-400 transition-colors ml-4'
        >
          <Plus className='size-4' />
          Add
        </button>
      </div>

      {settings.length === 0 ? (
        <p className='text-sm text-muted-foreground text-center py-6'>
          No notifications configured
        </p>
      ) : (
        <div className='flex flex-col gap-2'>
          {settings.map((setting) => (
            <SettingRow key={setting.id} setting={setting} teamId={teamId} />
          ))}
        </div>
      )}
    </div>
  );
}
