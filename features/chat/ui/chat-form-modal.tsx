'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { createChat, updateChat } from '@/features/chat/api/chats';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';
import Input from '@/shared/ui/input/Input';
import { Modal } from '@/shared/ui/modal/modal';

import type { OrganizationProps } from '@/entities/organization';
import type { Chat } from '@/features/chat/types';

interface ChatFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: OrganizationProps[];
  chat?: Chat | null;
  onSaved: (chat: Chat, mode: 'create' | 'update') => void;
}

interface ChatFormValues {
  title: string;
}

const EMPTY_VALUES: ChatFormValues = {
  title: '',
};

/**
 * ChatFormModal renders create/edit flow for personal web chats.
 * @param props - component props.
 * @param props.isOpen
 * @param props.onClose
 * @param props.organizations
 * @param props.chat
 * @param props.onSaved
 * @returns JSX element.
 */
export function ChatFormModal({
  isOpen,
  onClose,
  organizations,
  chat,
  onSaved,
}: ChatFormModalProps) {
  const isEdit = Boolean(chat);
  const hasOrganizationContext = organizations.length > 0;
  const hasAssignedScope =
    (chat?.organization_id ?? null) !== null ||
    (chat?.team_id ?? null) !== null;
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState('');
  const defaultValues = useMemo<ChatFormValues>(() => {
    if (!chat) {
      return EMPTY_VALUES;
    }

    return {
      title: chat.title ?? '',
    };
  }, [chat]);
  const {
    register,
    watch,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ChatFormValues>({
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
      setRootError('');
    }
  }, [defaultValues, isOpen, reset]);

  /**
   * onSubmit.
   * @param values - form values.
   * @returns Result.
   */
  const onSubmit = (values: ChatFormValues) => {
    setRootError('');

    startTransition(async () => {
      try {
        const payload = {
          title: values.title.trim() || null,
        };
        const result = chat
          ? await updateChat(chat.id, payload)
          : await createChat(payload);

        if ('error' in result) {
          if (result.fieldErrors) {
            for (const [field, message] of Object.entries(result.fieldErrors)) {
              if (field === 'title') {
                setError(field, { message });
              }
            }
          }

          setRootError(result.error);

          return;
        }

        toast.success(isEdit ? 'Chat updated' : 'Chat created');
        onSaved(result, isEdit ? 'update' : 'create');
        onClose();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save chat';

        setRootError(message);
        toast.error(message);
      }
    });
  };
  let helperText = `Personal web chats are not permanently bound. They use the current ${
    hasOrganizationContext
      ? 'organization context selected in the app header.'
      : 'user context.'
  }`;

  if (isEdit && hasAssignedScope) {
    helperText = chat?.team_id
      ? `This chat has a fixed scope: Org #${chat.organization_id} · Team #${chat.team_id}.`
      : `This chat has a fixed scope: Org #${chat?.organization_id}.`;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit chat' : 'Create chat'}
    >
      <form className='flex flex-col gap-4' onSubmit={handleSubmit(onSubmit)}>
        <Input
          {...register('title', {
            /**
             *
             */
            onChange: () => {
              clearErrors('title');
              setRootError('');
            },
          })}
          label='Title'
          value={watch('title')}
          error={errors.title?.message}
        />

        {rootError ? (
          <p className='text-sm text-destructive'>{rootError}</p>
        ) : null}
        {rootError ? null : (
          <p className='text-xs text-muted-foreground'>{helperText}</p>
        )}

        <div className='flex gap-3 pt-2'>
          <Button
            type='button'
            variant={BUTTON_VARIANT.secondary}
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type='submit' loading={isPending}>
            {isEdit ? 'Save changes' : 'Create chat'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
