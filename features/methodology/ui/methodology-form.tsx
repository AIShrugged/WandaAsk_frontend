'use client';

import React, { useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import {
  createMethodology,
  updateMethodology,
} from '@/app/actions/methodology';
import {
  FORM_FIELDS,
  METHODOLOGY_FIELDS,
} from '@/features/methodology/lib/options';
import { BUTTON } from '@/shared/lib/buttons';
import { VARIANT_MAPPER, type VariantType } from '@/shared/lib/fieldMapper';
import { Button } from '@/shared/ui/button/Button';

import type {
  MethodologyDTO,
  MethodologyProps,
} from '@/features/methodology/model/types';

export default function MethodologyForm({
  values,
  organization_id,
}: {
  organization_id: number;
  values?: MethodologyProps;
}) {
  const FORM_ID = 'methodology-form';
  const isEdit = Boolean(values?.id);

  const [isPending, startTransition] = useTransition();

  const { control, handleSubmit, reset, setError } = useForm<MethodologyDTO>({
    defaultValues: values ?? METHODOLOGY_FIELDS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = (data: MethodologyDTO) => {
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateMethodology(organization_id, data);
          toast.success('Methodology updated');
        } else {
          await createMethodology(organization_id, data);
          toast.success('Methodology created');
          reset();
        }
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
      {FORM_FIELDS.map(field => (
        <Controller
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
      ))}
    </form>
  );
}
