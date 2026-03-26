'use client';

import { useOptimistic, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  linkIdentity,
  unlinkIdentity,
} from '@/features/user-profile/api/identities';
import { Button } from '@/shared/ui/button/Button';

import type { Identity } from '../types';

const CHANNEL_OPTIONS = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'google_calendar', label: 'Google Calendar' },
] as const;
const INPUT_CLASS =
  'rounded-[var(--radius-button)] border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30';

/**
 * Capitalizes the first letter of a string and replaces underscores with spaces.
 * @param value - Raw channel string from API.
 * @returns Human-readable channel label.
 */
function formatChannel(value: string): string {
  return value.replaceAll('_', ' ').replace(/^\w/, (c) => {
    return c.toUpperCase();
  });
}

interface LinkFormData {
  channel: string;
  identifier: string;
}

interface IdentitiesSectionProps {
  initialIdentities: Identity[];
}

/**
 * IdentitiesSection — displays linked external channel identities and allows
 * linking new ones or unlinking existing ones.
 * @param root0 - Component props.
 * @param root0.initialIdentities - Server-fetched identities to display initially.
 * @returns JSX element.
 */
export function IdentitiesSection({
  initialIdentities,
}: IdentitiesSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticIdentities, applyOptimistic] = useOptimistic(
    initialIdentities,
    (
      current: Identity[],
      action:
        | { type: 'remove'; id: number }
        | { type: 'add'; identity: Identity },
    ) => {
      if (action.type === 'remove') {
        return current.filter((item) => {
          return item.id !== action.id;
        });
      }

      return [...current, action.identity];
    },
  );
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<LinkFormData>({
    defaultValues: { channel: 'telegram', identifier: '' },
  });
  /**
   * handleUnlink — optimistically removes an identity and calls the server action.
   * @param id - Identity record ID to unlink.
   * @returns {void}
   */
  const handleUnlink = (id: number) => {
    startTransition(async () => {
      applyOptimistic({ type: 'remove', id });

      const result = await unlinkIdentity(id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Identity unlinked.');
      }
    });
  };
  /**
   * onLinkSubmit — submits the link form, handles conflict and generic errors.
   * @param data - Form data containing channel and identifier.
   * @returns {void}
   */
  const onLinkSubmit = (data: LinkFormData) => {
    startTransition(async () => {
      const result = await linkIdentity(data);

      if (result.error) {
        if (result.errorCode === 'IDENTITY_CONFLICT') {
          setError('identifier', { message: result.error });

          return;
        }

        toast.error(result.error);

        return;
      }

      if (result.data === null) return;

      applyOptimistic({ type: 'add', identity: result.data });
      toast.success('Identity linked successfully.');
      reset();
    });
  };

  return (
    <div className='flex flex-col gap-6'>
      {/* Linked identities list */}
      {optimisticIdentities.length > 0 ? (
        <ul className='flex flex-col gap-3'>
          {optimisticIdentities.map((identity) => {
            return (
              <li
                key={identity.id}
                className='flex items-center justify-between gap-4 rounded-[var(--radius-button)] border border-border bg-background px-3 py-2'
              >
                <div className='flex flex-col gap-0.5'>
                  <span className='text-sm font-medium text-foreground'>
                    {formatChannel(identity.channel)}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {identity.channel_identifier}
                  </span>
                </div>
                <Button
                  type='button'
                  variant='secondary'
                  loading={isPending}
                  disabled={isPending}
                  onClick={() => {
                    handleUnlink(identity.id);
                  }}
                  className='w-auto px-3 h-8 text-xs'
                >
                  Unlink
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className='text-sm text-muted-foreground'>
          No external accounts linked yet.
        </p>
      )}

      {/* Link new identity form */}
      <form
        onSubmit={handleSubmit(onLinkSubmit)}
        className='flex flex-col gap-4'
      >
        <h3 className='text-sm font-medium text-foreground'>
          Link a new account
        </h3>

        <div className='flex flex-col gap-1.5'>
          <label
            htmlFor='channel'
            className='text-sm font-medium text-foreground'
          >
            Channel
          </label>
          <select
            id='channel'
            {...register('channel', { required: 'Please select a channel' })}
            className={INPUT_CLASS}
          >
            {CHANNEL_OPTIONS.map((option) => {
              return (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              );
            })}
          </select>
          {errors.channel && (
            <p className='text-xs text-destructive'>{errors.channel.message}</p>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <label
            htmlFor='identifier'
            className='text-sm font-medium text-foreground'
          >
            Identifier
          </label>
          <input
            id='identifier'
            type='text'
            {...register('identifier', {
              required: 'Identifier is required',
            })}
            placeholder='e.g. your Telegram user ID or email'
            className={INPUT_CLASS}
          />
          {errors.identifier && (
            <p className='text-xs text-destructive'>
              {errors.identifier.message}
            </p>
          )}
        </div>

        <div className='w-full md:w-[170px]'>
          <Button type='submit' loading={isPending} disabled={isPending}>
            Link account
          </Button>
        </div>
      </form>
    </div>
  );
}
