'use client';

import React, { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { createTeam, updateTeam } from '@/app/actions/team';
import { TEAM_CREATE_FIELDS } from '@/features/teams/model/fields';
import { BUTTON } from '@/shared/lib/buttons';
import { VARIANT_MAPPER, type VariantType } from '@/shared/lib/fieldMapper';
import { Button } from '@/shared/ui/button/Button';

import type { TeamCreateDTO, TeamProps } from '@/features/teams/model/types';

export default function TeamCreateForm({
  values,
  organization_id,
}: {
  values: TeamProps;
  organization_id: string;
}) {
  const FORM_ID = 'team-create-form';
  const isEdit = Boolean(values?.id);

  const [isPending, startTransition] = useTransition();

  const { control, handleSubmit, setError } = useForm<TeamCreateDTO>({
    defaultValues: values,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = (data: TeamCreateDTO) => {
    startTransition(async () => {
      try {
        await (isEdit
          ? updateTeam(values.id, data)
          : createTeam(organization_id, data));
      } catch (error) {
        setError('name', {
          message: (error as Error).message,
        });
      }
    });
  };

  return (
    <form
      id={FORM_ID}
      onSubmit={handleSubmit(onSubmit)}
      className='flex flex-col flex-1 gap-4'
    >
      {TEAM_CREATE_FIELDS.map(field => (
        <Controller
          key={field.name}
          name={field.name as keyof TeamCreateDTO}
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
      <div className={'mt-auto w-[170px]'}>
        <Button loading={isPending} disabled={isPending} type='submit'>
          {BUTTON.SAVE}
        </Button>
      </div>
    </form>
  );
}
