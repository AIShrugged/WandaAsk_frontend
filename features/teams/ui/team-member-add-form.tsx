'use client';

import { useSearchParams } from 'next/navigation';
import React, { useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { sendInvite } from '@/features/teams/api/team';
import {
  TEAM_MEMBER_ADD_FIELDS,
  TEAM_MEMBER_ADD_VALUES,
} from '@/features/teams/model/fields';
import { BUTTON } from '@/shared/lib/buttons';
import { VARIANT_MAPPER, type VariantType } from '@/shared/lib/fieldMapper';
import { Button } from '@/shared/ui/button/Button';

import type { TeamAddMemberDTO } from '@/entities/team';
import type { ModalContextValue } from '@/shared/types/modal';

const FORM_ID = 'team-member-add-form';

/**
 * TeamMemberAddForm component.
 * @param props - Component props.
 * @param props.close
 */
export default function TeamMemberAddForm({ close }: ModalContextValue) {
  const searchParams = useSearchParams();

  const currentTeamId = searchParams.get('team_id');

  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    setError,
    formState: { isDirty },
  } = useForm<TeamAddMemberDTO>({
    defaultValues: TEAM_MEMBER_ADD_VALUES,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  /**
   * onSubmit.
   * @param data - data.
   * @returns Result.
   */
  const onSubmit = (data: TeamAddMemberDTO) => {
    startTransition(async () => {
      try {
        const result = await sendInvite(Number(currentTeamId), data);

        toast.success(result.message);
        close();
      } catch (error) {
        setError('email', {
          message: (error as Error).message,
        });
      }
    });
  };

  return (
    <form
      id={FORM_ID}
      onSubmit={handleSubmit(onSubmit)}
      className='w-full flex flex-col gap-8'
    >
      {TEAM_MEMBER_ADD_FIELDS.map((field) => {
        return (
          <Controller
            key={field.name}
            name={field.name as keyof TeamAddMemberDTO}
            control={control}
            rules={field.rules}
            render={({ field: hookField, fieldState }) => {
              const variant: VariantType = field.variant;

              const Component = VARIANT_MAPPER[variant];

              return (
                <Component
                  field={hookField}
                  fieldState={fieldState}
                  config={field}
                />
              );
            }}
          />
        );
      })}
      <div className={'flex flex-col gap-3'}>
        <Button loading={isPending} disabled={isPending || !isDirty}>
          {BUTTON.INVITE}
        </Button>
      </div>
    </form>
  );
}
