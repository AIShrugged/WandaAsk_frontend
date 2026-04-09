'use client';

import { useRouter } from 'next/navigation';
import React, { useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  createMethodology,
  updateMethodology,
} from '@/features/methodology/api/methodology';
import {
  getFormFields,
  METHODOLOGY_FIELDS,
} from '@/features/methodology/lib/options';
import { BUTTON } from '@/shared/lib/buttons';
import { VARIANT_MAPPER, type VariantType } from '@/shared/lib/fieldMapper';
import { ROUTES } from '@/shared/lib/routes';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';

import type { TeamProps } from '@/entities/team';
import type {
  MethodologyDTO,
  MethodologyProps,
} from '@/features/methodology/model/types';

const FORM_ID = 'methodology-form';

/**
 * MethodologyForm component.
 * @param root0
 * @param root0.organization_id
 * @param root0.teams
 * @param root0.values
 * @returns JSX element.
 */
export default function MethodologyForm({
  values,
  organization_id,
  teams,
}: {
  organization_id: string;
  teams: TeamProps[];
  values?: MethodologyProps;
}) {
  const isEdit = Boolean(values?.id);
  const disabled = values?.id === 1;
  const [isPending, startTransition] = useTransition();
  const { push } = useRouter();
  const formFields = getFormFields(
    teams.map((team) => {
      return { value: String(team.id), label: team.name };
    }),
  );
  const initialTeamIds =
    values?.teams?.map((team) => {
      return String(team.id);
    }) ?? [];
  const {
    control,
    handleSubmit,
    setError,
    formState: { isDirty },
  } = useForm<MethodologyDTO>({
    defaultValues: values
      ? { ...values, organization_id, team_ids: initialTeamIds }
      : { ...METHODOLOGY_FIELDS, organization_id },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  /**
   * onSubmit.
   * @param data - data.
   * @returns Result.
   */
  const onSubmit = (data: MethodologyDTO) => {
    startTransition(async () => {
      try {
        if (isEdit && values) {
          const existingTeamIds =
            values.teams?.map((team) => {
              return String(team.id);
            }) ?? [];
          const mergedTeamIds = [
            ...new Set([...existingTeamIds, ...data.team_ids]),
          ];

          await updateMethodology(values.id, {
            ...data,
            team_ids: mergedTeamIds,
          });
          toast.success(`Methodology updated`);
        } else {
          await createMethodology(data);
          toast.success(`Methodology created`);
        }
        push(ROUTES.DASHBOARD.METHODOLOGY);
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
      className='flex flex-col flex-1 gap-8'
    >
      {formFields.map((field) => {
        return (
          <Controller
            disabled={disabled}
            key={field.name}
            name={field.name as keyof MethodologyDTO}
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
      <div className={'mt-auto w-full md:w-[170px]'}>
        <Button
          form={FORM_ID}
          loading={isPending}
          disabled={isPending || !isDirty}
          type={'submit'}
          variant={BUTTON_VARIANT.primary}
        >
          {BUTTON.SAVE}
        </Button>
      </div>
    </form>
  );
}
