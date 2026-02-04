'use client';

import React, { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { createInviteTeamMember } from '@/features/teams/api/team';
import {
  TEAM_MEMBER_ADD_FIELDS,
  TEAM_MEMBER_ADD_VALUES,
} from '@/features/teams/model/fields';
import { BUTTON } from '@/shared/lib/buttons';
import { VARIANT_MAPPER, type VariantType } from '@/shared/lib/fieldMapper';
import { Button } from '@/shared/ui/button/Button';

import type { TeamAddMemberDTO } from '@/features/teams/model/types';

export default function TeamMemberAddForm() {
  const FORM_ID = 'team-member-add-form';

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

  const onSubmit = (data: TeamAddMemberDTO) => {
    startTransition(async () => {
      try {
        await createInviteTeamMember(data);
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
      {TEAM_MEMBER_ADD_FIELDS.map(field => (
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
      ))}
      <div className={'flex flex-col gap-3'}>
        <Button loading={isPending} disabled={isPending || !isDirty}>
          {BUTTON.INVITE}
        </Button>
      </div>
    </form>
  );
}
