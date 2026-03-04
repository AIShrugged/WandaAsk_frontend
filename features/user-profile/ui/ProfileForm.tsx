'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { updateProfile } from '@/features/user-profile/api/profile';
import { Button } from '@/shared/ui/button/Button';

import type { UserProps } from '@/entities/user';

interface ProfileFormData {
  name: string;
  email: string;
}

export function ProfileForm({ user }: { user: UserProps }) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { isDirty, errors },
  } = useForm<ProfileFormData>({
    defaultValues: { name: user.name, email: user.email },
  });

  const onSubmit = (data: ProfileFormData) => {
    startTransition(async () => {
      const result = await updateProfile(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Profile updated successfully');
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='name' className='text-sm font-medium text-foreground'>
          Name
        </label>
        <input
          id='name'
          type='text'
          {...register('name', { required: 'Name is required' })}
          className='rounded-[var(--radius-button)] border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
          placeholder='Your full name'
        />
        {errors.name && (
          <p className='text-xs text-destructive'>{errors.name.message}</p>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='email' className='text-sm font-medium text-foreground'>
          Email
        </label>
        <input
          id='email'
          type='email'
          {...register('email', { required: 'Email is required' })}
          className='rounded-[var(--radius-button)] border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
          placeholder='you@example.com'
        />
        {errors.email && (
          <p className='text-xs text-destructive'>{errors.email.message}</p>
        )}
      </div>

      <div className='w-full md:w-[170px]'>
        <Button type='submit' loading={isPending} disabled={isPending || !isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
