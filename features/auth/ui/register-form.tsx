'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import React, { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { register } from '@/features/auth/api/auth';
import {
  REGISTER_FIELDS,
  REGISTER_FIELDS_VALUES,
} from '@/features/auth/lib/fields';
import { BUTTON_TEXT } from '@/features/auth/lib/options';
import {
  RegisterSchema,
  type RegisterInput,
} from '@/features/auth/model/schemas';
import { VARIANT_MAPPER, type VariantType } from '@/shared/lib/fieldMapper';
import { handleFormError } from '@/shared/lib/formErrors';
import { ROUTES } from '@/shared/lib/routes';
import AuthFormFooter from '@/features/auth/ui/auth-form-footer';

const FORM_ID = 'register-form';

export default function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const invite = searchParams.get('invite');

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<RegisterInput>({
    defaultValues: REGISTER_FIELDS_VALUES,
    resolver: zodResolver(RegisterSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = (data: RegisterInput) => {
    startTransition(async () => {
      try {
        await register({ ...data, invite: invite || undefined });
      } catch (error) {
        handleFormError(
          error,
          setError,
          'Registration failed. Please try again.',
        );
      }
    });
  };

  return (
    <>
      <form
        id={FORM_ID}
        onSubmit={handleSubmit(onSubmit)}
        className='w-full flex flex-col gap-8'
        aria-describedby={errors.root ? 'form-error' : undefined}
      >
        {errors.root?.message && (
          <p
            id='form-error'
            role='alert'
            aria-live='polite'
            className='text-sm text-red-700 text-center'
          >
            {errors.root.message}
          </p>
        )}
        {REGISTER_FIELDS.map(field => (
          <Controller
            key={field.name}
            name={field.name as keyof RegisterInput}
            control={control}
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

      <AuthFormFooter
        loading={isPending}
        disabled={isPending || !isDirty}
        formId={FORM_ID}
        primaryButton={BUTTON_TEXT.GET_STARTED}
        primaryText={`${BUTTON_TEXT.LOGIN} here`}
        secondaryText={'Already have an account?'}
        secondaryRoute={ROUTES.AUTH.LOGIN}
      />
    </>
  );
}
