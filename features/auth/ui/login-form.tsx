'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { login } from '@/features/auth/api/auth';
import { SIGN_IN_FIELDS, SIGN_IN_VALUES } from '@/features/auth/lib/fields';
import { BUTTON_TEXT } from '@/features/auth/lib/options';
import { LoginSchema, type LoginInput } from '@/features/auth/model/schemas';
import AuthFormFooter from '@/features/auth/ui/auth-form-footer';
import { VARIANT_MAPPER, type VariantType } from '@/shared/lib/fieldMapper';
import { handleFormError } from '@/shared/lib/formErrors';
import { ROUTES } from '@/shared/lib/routes';

const FORM_ID = 'login-form';

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<LoginInput>({
    defaultValues: SIGN_IN_VALUES,
    resolver: zodResolver(LoginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      try {
        await login(data);
      } catch (error) {
        handleFormError(error, setError, 'Login failed. Please try again.');
      }
    });
  };

  return (
    <>
      <form
        id={FORM_ID}
        onSubmit={handleSubmit(onSubmit)}
        className='w-full flex flex-col gap-4'
        aria-describedby={errors.root ? 'form-error' : undefined}
      >
        {errors.root?.message && (
          <p
            id='form-error'
            role='alert'
            aria-live='polite'
            className='text-sm text-destructive text-center'
          >
            {errors.root.message}
          </p>
        )}
        {SIGN_IN_FIELDS.map(field => (
          <Controller
            key={field.name}
            name={field.name as keyof LoginInput}
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
        primaryButton={BUTTON_TEXT.LOGIN}
        primaryText={`${BUTTON_TEXT.REGISTER}`}
        secondaryText={'Dont have an account?'}
        secondaryRoute={ROUTES.AUTH.REGISTER}
      />
    </>
  );
}
