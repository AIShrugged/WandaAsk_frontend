'use client';

import Link from 'next/link';
import React, { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { createOrganization } from '@/features/organization/api/organization';
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
} from '@/entities/organization';

/**
 * OrganizationForm component.
 * @param root0
 * @param root0.values
 */
export default function OrganizationForm({
  values,
}: {
  values?: OrganizationProps;
}) {
  const FORM_ID = 'organization-form';
  const isEdit = Boolean(values?.id);
  const [isPending, startTransition] = useTransition();
  const {
    control,
    handleSubmit,
    setError,
    formState: { isDirty },
  } = useForm<OrganizationDTO>({
    defaultValues: values ?? ORGANIZATION_VALUES,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  /**
   * onSubmit.
   * @param data - data.
   * @returns Result.
   */
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
        className='w-full flex flex-col gap-8 h-full'
      >
        {ORGANIZATION_FIELDS.map((field) => {
          return (
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
          );
        })}

        {isEdit && (
          <div className={'mt-auto w-full md:w-[170px]'}>
            <Button
              type={'submit'}
              form={FORM_ID}
              loading={isPending}
              disabled={isPending || !isDirty}
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
            disabled={isPending || !isDirty}
          >
            {BUTTON.SAVE}
          </Button>
          <Link href={ROUTES.AUTH.ORGANIZATION} className='cursor-pointer'>
            <Button variant={'secondary'}>{BUTTON.BACK}</Button>
          </Link>
        </div>
      )}
    </>
  );
}
