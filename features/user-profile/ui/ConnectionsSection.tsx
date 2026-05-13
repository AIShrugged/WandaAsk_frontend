'use client';

import { ExternalLink, Link2Off, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { generateTelegramLink, unlinkIdentity } from '../api/connections';

import type { UserIdentityProps } from '../model/types';

const CHANNEL_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  google_calendar: 'Google Calendar',
  zoom: 'Zoom',
};

function channelLabel(channel: string): string {
  return CHANNEL_LABELS[channel] ?? channel;
}

function IdentityRow({
  identity,
  onUnlinked,
}: {
  identity: UserIdentityProps;
  onUnlinked: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleUnlink = async () => {
    setIsPending(true);
    const result = await unlinkIdentity(identity.id);
    setIsPending(false);
    setConfirming(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${channelLabel(identity.channel)} disconnected.`);
      onUnlinked();
    }
  };

  return (
    <div className='flex items-center justify-between gap-4 rounded-[var(--radius-button)] border border-border bg-background px-3 py-2'>
      <div className='flex flex-col gap-0.5'>
        <span className='text-sm font-medium text-foreground'>
          {channelLabel(identity.channel)}
        </span>
        <span className='text-xs text-muted-foreground'>
          {identity.channel_identifier}
        </span>
      </div>

      {confirming ? (
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>Are you sure?</span>
          <button
            type='button'
            onClick={handleUnlink}
            disabled={isPending}
            className='text-sm text-destructive hover:underline disabled:opacity-50'
          >
            {isPending ? 'Disconnecting...' : 'Yes, disconnect'}
          </button>
          <button
            type='button'
            onClick={() => {
              return setConfirming(false);
            }}
            disabled={isPending}
            className='text-sm text-muted-foreground hover:underline disabled:opacity-50'
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => {
            return setConfirming(true);
          }}
          className='flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive hover:underline'
        >
          <Link2Off className='size-3.5' />
          Disconnect
        </button>
      )}
    </div>
  );
}

export function ConnectionsSection({
  identities,
}: {
  identities: UserIdentityProps[];
}) {
  const router = useRouter();
  const [linkPending, setLinkPending] = useState(false);

  const hasTelegram = identities.some((i) => {
    return i.channel === 'telegram';
  });

  const handleConnectTelegram = async () => {
    setLinkPending(true);
    const result = await generateTelegramLink();
    setLinkPending(false);

    if (result.error || !result.data) {
      toast.error(result.error ?? 'Failed to generate Telegram link');
      return;
    }

    window.open(result.data.link_url, '_blank', 'noopener,noreferrer');
    toast.success('Telegram link opened — complete the connection in the bot.');
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-1'>
        <h3 className='text-sm font-semibold text-foreground'>
          Connected accounts
        </h3>
        <p className='text-xs text-muted-foreground'>
          Link external accounts to enable AI insights from those channels.
        </p>
      </div>

      {identities.length > 0 ? (
        <div className='flex flex-col gap-2'>
          {identities.map((identity) => {
            return (
              <IdentityRow
                key={identity.id}
                identity={identity}
                onUnlinked={() => {
                  return router.refresh();
                }}
              />
            );
          })}
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>No accounts connected.</p>
      )}

      {!hasTelegram && (
        <div className='flex flex-col gap-3 rounded-[var(--radius-button)] border border-border bg-background px-3 py-3'>
          <div className='flex items-center gap-2'>
            <Send className='size-4 text-muted-foreground' />
            <span className='text-sm font-medium text-foreground'>
              Telegram
            </span>
          </div>
          <p className='text-xs text-muted-foreground'>
            Connect your Telegram account so the AI assistant can process your
            messages and provide insights.
          </p>
          <button
            type='button'
            onClick={handleConnectTelegram}
            disabled={linkPending}
            className='flex w-fit items-center gap-1.5 rounded-[var(--radius-button)] bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
          >
            <ExternalLink className='size-3.5' />
            {linkPending ? 'Generating link...' : 'Connect Telegram'}
          </button>
        </div>
      )}
    </div>
  );
}
