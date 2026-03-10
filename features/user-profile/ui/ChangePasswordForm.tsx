'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { changePassword } from '@/features/user-profile/api/profile';
import { Button } from '@/shared/ui/button/Button';

interface ChangePasswordFormData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

/**
 * ChangePasswordForm component.
 */
export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    formState: { isDirty, errors },
  } = useForm<ChangePasswordFormData>({
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  });

  /**
   * onSubmit.
   * @param data - Form data.
   * @returns {void}
   */
  const onSubmit = (data: ChangePasswordFormData) => {
    startTransition(async () => {
      const result = await changePassword(data);

      if (result.error) {
        if (result.errorCode === 'INVALID_CURRENT_PASSWORD') {
          setError('current_password', { message: result.error });

          return;
        }

        toast.error(result.error);

        return;
      }

      toast.success('Password changed successfully');
      reset();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
      <div className='flex flex-col gap-1.5'>
        <label
          htmlFor='current_password'
          className='text-sm font-medium text-foreground'
        >
          Current password
        </label>
        <input
          id='current_password'
          type='password'
          {...register('current_password', {
            required: 'Current password is required',
          })}
          className='rounded-[var(--radius-button)] border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
          autoComplete='current-password'
        />
        {errors.current_password && (
          <p className='text-xs text-destructive'>
            {errors.current_password.message}
          </p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label
          htmlFor='password'
          className='text-sm font-medium text-foreground'
        >
          New password
        </label>
        <input
          id='password'
          type='password'
          {...register('password', {
            required: 'New password is required',
            minLength: { value: 8, message: 'At least 8 characters' },
          })}
          className='rounded-[var(--radius-button)] border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
          autoComplete='new-password'
        />
        {errors.password && (
          <p className='text-xs text-destructive'>{errors.password.message}</p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label
          htmlFor='password_confirmation'
          className='text-sm font-medium text-foreground'
        >
          Confirm new password
        </label>
        <input
          id='password_confirmation'
          type='password'
          {...register('password_confirmation', {
            required: 'Please confirm your password',
            /**
             * @param value - Confirmation value.
             * @returns True or error message.
             */
            validate: (value) => {
              return (
                value === getValues('password') || 'Passwords do not match'
              );
            },
          })}
          className='rounded-[var(--radius-button)] border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
          autoComplete='new-password'
        />
        {errors.password_confirmation && (
          <p className='text-xs text-destructive'>
            {errors.password_confirmation.message}
          </p>
        )}
      </div>

      <div className='w-full md:w-[170px]'>
        <Button
          type='submit'
          loading={isPending}
          disabled={isPending || !isDirty}
        >
          Change password
        </Button>
      </div>
    </form>
  );
}
