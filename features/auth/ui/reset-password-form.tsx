'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { resetPassword } from '@/features/auth/api/auth';
import {
  ResetPasswordSchema,
  type ResetPasswordInput,
} from '@/features/auth/model/schemas';
import { VARIANT_MAPPER } from '@/shared/lib/fieldMapper';
import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';

const FORM_ID = 'reset-password-form';

const PASSWORD_FIELD = {
  variant: 'inputPassword' as const,
  name: 'password',
  label: 'New password',
  type: 'input',
  placeholder: 'Enter new password',
};

const CONFIRM_FIELD = {
  variant: 'inputPassword' as const,
  name: 'password_confirmation',
  label: 'Confirm password',
  type: 'input',
  placeholder: 'Repeat new password',
};

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [isPending, startTransition] = useTransition();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<ResetPasswordInput>({
    defaultValues: { password: '', password_confirmation: '' },
    resolver: zodResolver(ResetPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = (data: ResetPasswordInput) => {
    if (!token) {
      setError('root', {
        message: 'Reset token is missing. Please use the link from your email.',
      });

      return;
    }

    startTransition(async () => {
      const result = await resetPassword(token, data);

      if (result.error) {
        setError('root', { message: result.error });

        return;
      }

      router.push(ROUTES.AUTH.LOGIN);
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
        <Controller
          name='password'
          control={control}
          render={({ field, fieldState }) => {
            const Component = VARIANT_MAPPER[PASSWORD_FIELD.variant];

            return (
              <Component
                field={field}
                fieldState={fieldState}
                config={PASSWORD_FIELD}
              />
            );
          }}
        />
        <Controller
          name='password_confirmation'
          control={control}
          render={({ field, fieldState }) => {
            const Component = VARIANT_MAPPER[CONFIRM_FIELD.variant];

            return (
              <Component
                field={field}
                fieldState={fieldState}
                config={CONFIRM_FIELD}
              />
            );
          }}
        />
      </form>

      <div className='flex flex-col gap-4 mt-8'>
        <Button
          disabled={isPending || !isDirty}
          loading={isPending}
          type='submit'
          form={FORM_ID}
        >
          Reset password
        </Button>

        <p className='text-sm text-center text-muted-foreground'>
          Remember your password?{' '}
          <Link
            className='cursor-pointer text-foreground font-medium hover:underline underline-offset-4'
            href={ROUTES.AUTH.LOGIN}
          >
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
