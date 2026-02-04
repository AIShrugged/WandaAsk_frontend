'use client';

import { useRouter } from 'next/navigation';
import React, { useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';

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

import type {
  MethodologyDTO,
  MethodologyProps,
} from '@/features/methodology/model/types';
import type { OrganizationProps } from '@/features/organization/model/types';
import { toast } from 'react-toastify';

const FORM_ID = 'methodology-form';

export default function MethodologyForm({
  values,
  organization_id,
  organizations,
}: {
  organization_id: string;
  organizations: OrganizationProps[];
  values?: MethodologyProps;
}) {
  const isEdit = Boolean(values?.id);
  const disabled = values?.id === 1;

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const formFields = getFormFields(
    organizations.map(org => ({ value: String(org.id), label: org.name })),
  );

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isDirty },
  } = useForm<MethodologyDTO>({
    defaultValues: values
      ? { ...values, organization_id }
      : { ...METHODOLOGY_FIELDS, organization_id },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = (data: MethodologyDTO) => {
    startTransition(async () => {
      try {
        if (isEdit && values) {
          await updateMethodology(values.id, data);
          toast.success(`Methodology updated`);
        } else {
          await createMethodology(data);
          toast.success(`Methodology created`);
          reset();
        }
        router.push(ROUTES.DASHBOARD.METHODOLOGY);
      } catch (error) {
        setError('name', {
          message: (error as Error).message,
        });
      }
    });
  };

  return (
    <>
      <form
        id={FORM_ID}
        onSubmit={handleSubmit(onSubmit)}
        className='flex flex-col flex-1 gap-8'
      >
        {formFields.map(field => (
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
        ))}
        <div className={'mt-auto w-[170px]'}>
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
    </>
  );
}
