'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useRef, useTransition, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { forgotPassword } from '@/features/auth/api/auth';
import {
  ForgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/features/auth/model/schemas';
import { VARIANT_MAPPER } from '@/shared/lib/fieldMapper';
import { emailField } from '@/shared/lib/fields';
import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';

const FORM_ID = 'forgot-password-form';

export default function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordInput>({
    defaultValues: { email: '' },
    resolver: zodResolver(ForgotPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (submitted) {
      successRef.current?.focus();
    }
  }, [submitted]);

  const onSubmit = (data: ForgotPasswordInput) => {
    startTransition(async () => {
      const result = await forgotPassword(data);

      if (result.error) {
        setError('root', { message: result.error });

        return;
      }

      setSubmitted(true);
    });
  };

  if (submitted) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role='status'
        className='flex flex-col gap-6 outline-none'
      >
        <p className='text-sm text-muted-foreground text-center'>
          If that email address is in our system, you will receive a password
          reset link shortly.
        </p>
        <Link
          href={ROUTES.AUTH.LOGIN}
          className='text-sm text-center text-foreground font-medium hover:underline underline-offset-4'
        >
          Back to sign in
        </Link>
      </div>
    );
  }

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
            className='text-sm text-destructive text-center'
          >
            {errors.root.message}
          </p>
        )}
        <Controller
          name='email'
          control={control}
          render={({ field, fieldState }) => {
            const Component = VARIANT_MAPPER[emailField.variant];

            return (
              <Component
                field={field}
                fieldState={fieldState}
                config={emailField}
              />
            );
          }}
        />
      </form>

      <div className='flex flex-col gap-4 mt-8'>
        <Button
          disabled={isPending || !isValid}
          loading={isPending}
          type='submit'
          form={FORM_ID}
        >
          Send reset link
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
