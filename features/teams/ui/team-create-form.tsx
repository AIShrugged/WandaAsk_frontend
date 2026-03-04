'use client';

import { useRouter } from 'next/navigation';
import React, { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';

import { createTeam, updateTeam } from '@/features/teams/api/team';
import { TEAM_CREATE_FIELDS } from '@/features/teams/model/fields';
import { useTeamsStore } from '@/features/teams/model/teams-store';
import { BUTTON } from '@/shared/lib/buttons';
import { VARIANT_MAPPER, type VariantType } from '@/shared/lib/fieldMapper';
import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';

import type { TeamCreateDTO, TeamProps } from '@/entities/team';

export default function TeamCreateForm({
  values,
  organization_id,
}: {
  values: TeamProps;
  organization_id: string;
}) {
  const FORM_ID = 'team-create-form';
  const isEdit = Boolean(values?.id);
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<TeamCreateDTO>({
    defaultValues: values,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = (data: TeamCreateDTO) => {
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateTeam(values.id, data);
        } else {
          const result = await createTeam(organization_id, data);
          if (result.error) {
            toast.error(result.error);
            return;
          }
        }

        useTeamsStore.getState().invalidate();
        router.push(ROUTES.DASHBOARD.TEAMS);
      } catch (error) {
        toast.error((error as Error).message);
      }
    });
  };

  return (
    <form
      id={FORM_ID}
      onSubmit={handleSubmit(onSubmit)}
      className='flex flex-col flex-1 gap-8'
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
      <div className={'mt-auto w-full md:w-[170px]'}>
        <Button
          loading={isPending}
          disabled={isPending || !isDirty}
          type='submit'
        >
          {BUTTON.SAVE}
        </Button>
      </div>
    </form>
  );
}
