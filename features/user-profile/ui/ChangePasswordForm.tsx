'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { changePassword } from '@/features/user-profile/api/profile';
import { Button } from '@/shared/ui/button/Button';
import InputPassword from '@/shared/ui/input/InputPassword';

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
    watch,
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

      toast.success('Password changed. Other sessions have been signed out.');
      reset();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
      <InputPassword
        {...register('current_password', {
          required: 'Current password is required',
        })}
        label='Current password'
        value={watch('current_password')}
        error={errors.current_password?.message}
        autoComplete='current-password'
      />

      <InputPassword
        {...register('password', {
          required: 'New password is required',
          minLength: { value: 8, message: 'At least 8 characters' },
        })}
        label='New password'
        value={watch('password')}
        error={errors.password?.message}
        autoComplete='new-password'
      />

      <InputPassword
        {...register('password_confirmation', {
          required: 'Please confirm your password',
          /**
           * @param value - Confirmation value.
           * @returns True or error message.
           */
          validate: (value) => {
            return value === getValues('password') || 'Passwords do not match';
          },
        })}
        label='Confirm new password'
        value={watch('password_confirmation')}
        error={errors.password_confirmation?.message}
        autoComplete='new-password'
      />

      <div className='w-full md:w-auto'>
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
