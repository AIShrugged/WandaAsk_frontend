'use client';

import { format, formatDistanceToNowStrict, isPast } from 'date-fns';
import {
  Bot,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  TimerReset,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { toast } from 'sonner';

import { getTeams } from '@/entities/team/api/team';
import {
  getTelegramChats,
  issueTelegramAttachCode,
} from '@/features/telegram/api/telegram';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Badge } from '@/shared/ui/badge';
import { Button, ButtonLink } from '@/shared/ui/button';
import { Card, CardBody } from '@/shared/ui/card';
import { TenantScopeFields } from '@/shared/ui/input/tenant-scope-fields';

import type { OrganizationProps } from '@/entities/organization';
import type { TelegramChatRegistration } from '@/entities/telegram';

interface TelegramChatsManagementProps {
  initialChats: TelegramChatRegistration[];
  organizations: OrganizationProps[];
}

type TelegramDisplayStatus =
  | 'private'
  | 'pending-binding'
  | 'code-issued'
  | 'code-expired'
  | 'bound';

function isPrivateTelegramChat(chat: TelegramChatRegistration) {
  return chat.chat_type === 'private';
}

function isGroupTelegramChat(chat: TelegramChatRegistration) {
  return chat.chat_type === 'group' || chat.chat_type === 'supergroup';
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return format(new Date(value), 'dd.MM.yyyy HH:mm');
}

function getTelegramStatus(
  chat: TelegramChatRegistration,
  now: Date,
): TelegramDisplayStatus {
  if (isPrivateTelegramChat(chat)) return 'private';
  if (chat.bound_at) return 'bound';
  if (
    chat.attach_code_expires_at &&
    isPast(new Date(chat.attach_code_expires_at))
  ) {
    return 'code-expired';
  }
  if (chat.attach_code) return 'code-issued';
  return 'pending-binding';
}

function statusBadgeProps(status: TelegramDisplayStatus) {
  switch (status) {
    case 'private': {
      return { label: 'Private chat', variant: 'default' as const };
    }
    case 'bound': {
      return { label: 'Bound', variant: 'success' as const };
    }
    case 'code-issued': {
      return { label: 'Code issued', variant: 'primary' as const };
    }
    case 'code-expired': {
      return { label: 'Code expired', variant: 'warning' as const };
    }
    default: {
      return { label: 'Pending binding', variant: 'default' as const };
    }
  }
}

function replaceTelegramChat(
  chats: TelegramChatRegistration[],
  updatedChat: TelegramChatRegistration,
) {
  return chats.map((item) => {
    return item.id === updatedChat.id ? updatedChat : item;
  });
}

function mergeRefreshedChats(
  prev: TelegramChatRegistration[],
  nextChats: TelegramChatRegistration[],
  inflightChatIds: Set<number>,
) {
  return nextChats.map((fetched) => {
    if (inflightChatIds.has(fetched.id)) {
      return (
        prev.find((p) => {
          return p.id === fetched.id;
        }) ?? fetched
      );
    }
    return fetched;
  });
}

function TelegramChatCard({
  chat,
  organizations,
  now,
  onRefresh,
  onUpdate,
  onMutationStart,
  onMutationEnd,
}: {
  chat: TelegramChatRegistration;
  organizations: OrganizationProps[];
  now: Date;
  onRefresh: () => void;
  onUpdate: (chat: TelegramChatRegistration) => void;
  onMutationStart: (id: number) => void;
  onMutationEnd: (id: number) => void;
}) {
  const [organizationId, setOrganizationId] = useState(
    chat.organization_id ? String(chat.organization_id) : '',
  );
  const [teamId, setTeamId] = useState(
    chat.team_id ? String(chat.team_id) : '',
  );
  const [rootError, setRootError] = useState('');
  const [isPending, startTransition] = useTransition();
  // Synchronous ref guard prevents double-click from firing two concurrent Server Actions.
  // useTransition's isPending is not set synchronously, so a rapid second click could
  // slip through before React registers the transition as pending.
  const isMutatingRef = useRef(false);

  // Track last committed server values so auto-refresh doesn't wipe an in-progress selection.
  const lastCommittedOrgId = useRef(chat.organization_id);
  const lastCommittedTeamId = useRef(chat.team_id);

  useEffect(() => {
    if (chat.organization_id !== lastCommittedOrgId.current) {
      lastCommittedOrgId.current = chat.organization_id;

      setOrganizationId(
        chat.organization_id ? String(chat.organization_id) : '',
      );
    }
    if (chat.team_id !== lastCommittedTeamId.current) {
      lastCommittedTeamId.current = chat.team_id;
      setTeamId(chat.team_id ? String(chat.team_id) : '');
    }
  }, [chat.organization_id, chat.team_id]);

  const status = getTelegramStatus(chat, now);
  const badge = statusBadgeProps(status);
  const isPrivate = isPrivateTelegramChat(chat);
  const isAttachableGroup = isGroupTelegramChat(chat);
  const hasAssignedScope =
    chat.organization_id !== null || chat.team_id !== null;
  const isExpired =
    chat.attach_code_expires_at !== null &&
    isPast(new Date(chat.attach_code_expires_at));
  const canGenerateCode =
    isAttachableGroup && status !== 'bound' && !hasAssignedScope;
  const expirationLabel =
    chat.attach_code_expires_at && !isExpired
      ? formatDistanceToNowStrict(new Date(chat.attach_code_expires_at), {
          addSuffix: true,
        })
      : null;
  const title =
    chat.chat_title?.trim() || `Telegram chat #${chat.telegram_chat_id}`;
  let scopeText = 'Scope: Not assigned';
  let ownerText = 'Owner: My private chat';

  if (chat.user_id) {
    ownerText = `Owner: User #${chat.user_id}`;
  }

  if (!isPrivate && chat.organization_id) {
    scopeText = chat.team_id
      ? `Scope: Org #${chat.organization_id} · Team #${chat.team_id}`
      : `Scope: Org #${chat.organization_id}`;
  }

  const handleCopyCommand = () => {
    if (!chat.attach_command) return;
    navigator.clipboard.writeText(chat.attach_command).then(
      () => {
        toast.success('Attach command copied');
      },
      () => {
        toast.error('Could not copy — please copy manually');
      },
    );
  };

  const handleGenerateCode = () => {
    if (isMutatingRef.current) return;
    isMutatingRef.current = true;
    setRootError('');

    startTransition(async () => {
      try {
        const organizationNumericId = Number(organizationId);

        if (!organizationNumericId) {
          setRootError('Choose an organization before generating a code');
          return;
        }

        onMutationStart(chat.id);
        const result = await issueTelegramAttachCode(chat.id, {
          organization_id: organizationNumericId,
          team_id: teamId ? Number(teamId) : null,
        });

        if (result.error) {
          const organizationError = result.fieldErrors?.organization_id;
          setRootError(
            organizationError ||
              result.error.toLowerCase().includes('organization')
              ? 'Only an organization manager can bind a Telegram chat'
              : result.error,
          );
          return;
        }

        if (result.data) {
          toast.success('Attach code generated');
          onUpdate(result.data);
        }
      } finally {
        isMutatingRef.current = false;
        onMutationEnd(chat.id);
      }
    });
  };

  return (
    <Card>
      <CardBody>
        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
            <div className='min-w-0'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-violet-300'>
                  <Bot className='h-5 w-5' />
                </div>
                <div className='min-w-0'>
                  <h3 className='truncate text-lg font-semibold text-foreground'>
                    {title}
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    {chat.chat_type ?? 'Unknown type'}
                  </p>
                </div>
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant={badge.variant}>{badge.label}</Badge>
              {chat.bound_at ? (
                <Badge variant='success'>
                  <CheckCircle2 className='mr-1 h-3.5 w-3.5' />
                  Attached
                </Badge>
              ) : null}
            </div>
          </div>

          <div className='grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4'>
            <p>Telegram ID: {chat.telegram_chat_id}</p>
            <p>Thread ID: {chat.message_thread_id ?? '—'}</p>
            <p>{isPrivate ? ownerText : scopeText}</p>
            <p>Discovered: {formatDateTime(chat.created_at)}</p>
          </div>

          {isPrivate ? (
            <div className='rounded-[var(--radius-card)] border border-border bg-background/40 p-4 text-sm'>
              <p className='font-medium text-foreground'>
                My private Telegram chat
              </p>
              <p className='mt-1 text-muted-foreground'>
                Private Telegram chats are user-owned. They do not use
                organization/team binding and never go through attach-code flow.
              </p>
            </div>
          ) : null}

          {isAttachableGroup && !hasAssignedScope && status !== 'bound' ? (
            <TenantScopeFields
              organizations={organizations}
              organizationId={organizationId}
              teamId={teamId}
              fetchTeams={getTeams}
              onOrganizationChange={(value) => {
                setOrganizationId(value);
                setTeamId('');
                setRootError('');
              }}
              onTeamChange={(value) => {
                setTeamId(value);
                setRootError('');
              }}
              disabled={isPending}
            />
          ) : null}

          {isAttachableGroup && hasAssignedScope && status !== 'bound' ? (
            <div className='rounded-[var(--radius-card)] border border-border bg-background/40 p-4 text-sm'>
              <p className='font-medium text-foreground'>
                This Telegram chat is already assigned to a tenant scope
              </p>
              <p className='mt-1 text-muted-foreground'>
                Rebinding is disabled. You can only refresh the status or use
                the existing attach command for the assigned organization/team.
              </p>
            </div>
          ) : null}

          {isAttachableGroup && chat.attach_command && status !== 'bound' ? (
            <div className='rounded-[var(--radius-card)] border border-primary/20 bg-primary/5 p-4'>
              <p className='text-xs uppercase tracking-[0.2em] text-violet-300'>
                Attach command
              </p>
              <div className='mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <code className='block overflow-x-auto rounded-md bg-background/70 px-3 py-2 text-lg font-semibold text-foreground'>
                  {chat.attach_command}
                </code>
                <Button
                  type='button'
                  variant={BUTTON_VARIANT.secondary}
                  className='h-10 w-auto px-4'
                  onClick={handleCopyCommand}
                >
                  <Copy className='h-4 w-4' />
                  Copy command
                </Button>
              </div>
              <p className='mt-3 text-sm text-muted-foreground'>
                Open the Telegram chat and send this command:{' '}
                {chat.attach_command}
              </p>
              <div className='mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground'>
                <p>
                  Expires:{' '}
                  {expirationLabel
                    ? `${expirationLabel} (${formatDateTime(chat.attach_code_expires_at)})`
                    : formatDateTime(chat.attach_code_expires_at)}
                </p>
                <p>Issued at: {formatDateTime(chat.updated_at)}</p>
              </div>
            </div>
          ) : null}

          {isAttachableGroup && chat.bound_at ? (
            <div className='rounded-[var(--radius-card)] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm'>
              <p className='font-medium text-foreground'>
                Telegram chat successfully attached
              </p>
              <p className='mt-1 text-muted-foreground'>
                Bound at {formatDateTime(chat.bound_at)}. Any previous attach
                code is no longer valid.
              </p>
            </div>
          ) : null}

          {rootError ? (
            <p className='text-sm text-destructive'>{rootError}</p>
          ) : null}

          <div className='flex flex-wrap gap-3'>
            {canGenerateCode ? (
              <Button
                type='button'
                className='w-auto px-4'
                loading={isPending}
                onClick={handleGenerateCode}
              >
                {status === 'code-issued' || status === 'code-expired'
                  ? 'Regenerate code'
                  : 'Generate code'}
              </Button>
            ) : null}
            <Button
              type='button'
              variant={BUTTON_VARIANT.secondary}
              className='w-auto px-4'
              onClick={onRefresh}
            >
              <RefreshCw className='h-4 w-4' />
              Refresh
            </Button>
            {status === 'code-expired' &&
            !hasAssignedScope &&
            isAttachableGroup ? (
              <Badge variant='warning'>
                <TimerReset className='mr-1 h-3.5 w-3.5' />
                Code expired, issue a new one
              </Badge>
            ) : null}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function TelegramChatsManagement({
  initialChats,
  organizations,
}: TelegramChatsManagementProps) {
  const [chats, setChats] = useState(initialChats);
  const [now, setNow] = useState(() => {
    return new Date();
  });
  const [, startRefreshTransition] = useTransition();
  // Prevents concurrent refresh calls from racing on last-write-wins.
  const isRefreshingRef = useRef(false);
  // Tracks chat IDs that have an in-flight mutation so auto-refresh doesn't overwrite them.
  const [inflightChatIds, setInflightChatIds] = useState<Set<number>>(() => {
    return new Set();
  });

  const shouldAutoRefresh = useMemo(() => {
    return chats.some((chat) => {
      return (
        isGroupTelegramChat(chat) &&
        getTelegramStatus(chat, now) === 'code-issued'
      );
    });
  }, [chats, now]);

  const addInflight = useCallback((id: number) => {
    setInflightChatIds((prev) => {
      return new Set(prev).add(id);
    });
  }, []);

  const removeInflight = useCallback((id: number) => {
    setInflightChatIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    startRefreshTransition(async () => {
      try {
        const { data: nextChats } = await getTelegramChats();
        // Preserve local state for chats that have an in-flight mutation — prevents
        // a 5-second auto-refresh from overwriting optimistic UI with stale server data.
        setChats((prev) => {
          return mergeRefreshedChats(prev, nextChats ?? [], inflightChatIds);
        });
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        isRefreshingRef.current = false;
      }
    });
  }, [inflightChatIds]);

  // Gate the 1-second clock on shouldAutoRefresh to avoid re-rendering every card
  // every second when no code is active.
  useEffect(() => {
    if (!shouldAutoRefresh) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [shouldAutoRefresh]);

  useEffect(() => {
    if (!shouldAutoRefresh) return;
    const timer = setInterval(() => {
      // Skip polling when the tab is hidden to avoid unnecessary backend requests.
      if (document.visibilityState === 'visible') {
        refresh();
      }
    }, 5000);
    return () => {
      clearInterval(timer);
    };
    // Resetting the interval when inflightChatIds changes is intentional —
    // it prevents a stale overwrite mid-mutation when the timer fires.
  }, [refresh, shouldAutoRefresh]);

  return (
    <div className='flex flex-col gap-6'>
      <Card>
        <CardBody>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <h1 className='text-2xl font-semibold text-foreground'>
                Telegram chats
              </h1>
              <p className='mt-2 text-sm text-muted-foreground'>
                Private chats are user-owned and shown as informational entries.
                Only Telegram `group` and `supergroup` chats use the
                organization/team attach-code flow.
              </p>
            </div>
            <div className='flex gap-3'>
              <Button
                type='button'
                variant={BUTTON_VARIANT.secondary}
                className='w-auto px-4'
                onClick={refresh}
              >
                <RefreshCw className='h-4 w-4' />
                Refresh
              </Button>
              <ButtonLink
                href='/dashboard/chat'
                variant='secondary'
                leftIcon={<ExternalLink className='h-4 w-4' />}
              >
                Web chats
              </ButtonLink>
            </div>
          </div>
        </CardBody>
      </Card>

      {chats.length === 0 ? (
        <Card>
          <CardBody>
            <p className='text-sm text-muted-foreground'>
              No discovered Telegram chats yet. Add the bot to a Telegram chat
              first, then refresh this screen.
            </p>
          </CardBody>
        </Card>
      ) : (
        chats.map((chat) => {
          return (
            <TelegramChatCard
              key={chat.id}
              chat={chat}
              organizations={organizations}
              now={now}
              onRefresh={refresh}
              onUpdate={(updatedChat) => {
                setChats((prev) => {
                  return replaceTelegramChat(prev, updatedChat);
                });
              }}
              onMutationStart={addInflight}
              onMutationEnd={removeInflight}
            />
          );
        })
      )}
    </div>
  );
}
