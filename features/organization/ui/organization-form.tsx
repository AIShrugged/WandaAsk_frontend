'use client';

import Link from 'next/link';
import React, { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { createOrganization } from '@/app/actions/organization';
import {
  ORGANIZATION_FIELDS,
  ORGANIZATION_VALUES,
} from '@/features/organization/lib/fields';
import { BUTTON } from '@/shared/lib/buttons';
import { VARIANT_MAPPER, type VariantType } from '@/shared/lib/fieldMapper';
import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';

import type {
  OrganizationDTO,
  OrganizationProps,
} from '@/features/organization/model/types';

export default function OrganizationForm({
  values,
}: {
  values?: OrganizationProps;
}) {
  const FORM_ID = 'organization-form';
  const isEdit = Boolean(values?.id);

  console.log('isEdit', isEdit);

  const [isPending, startTransition] = useTransition();

  const { control, handleSubmit, setError } = useForm<OrganizationDTO>({
    defaultValues: values ?? ORGANIZATION_VALUES,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = (data: OrganizationDTO) => {
    startTransition(async () => {
      try {
        await createOrganization(data);
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
        className='w-full flex flex-col gap-[30px] h-full'
      >
        {ORGANIZATION_FIELDS.map(field => (
          <Controller
            key={field.name}
            name={field.name as keyof OrganizationDTO}
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

        {isEdit && (
          <div className={'mt-auto w-[170px]'}>
            <Button
              type={'submit'}
              form={FORM_ID}
              loading={isPending}
              disabled={isPending}
            >
              {BUTTON.SAVE}
            </Button>
          </div>
        )}
      </form>

      {!isEdit && (
        <div className={'flex flex-col gap-6 mt-12'}>
          <Button
            type={'submit'}
            form={FORM_ID}
            loading={isPending}
            disabled={isPending}
          >
            {BUTTON.SAVE}
          </Button>
          <Link href={ROUTES.AUTH.ORGANIZATION}>
            <Button variant={'secondary'}>{BUTTON.BACK}</Button>
          </Link>
        </div>
      )}
    </>
  );
}
