import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email('Please enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'The minimum password length is 6 characters'),
});

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'The minimum name length is 2 characters')
    .regex(/^\S.*\S$|^\S$/, 'Name cannot start or end with spaces'),
  email: z.email('Please enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'The minimum password length is 6 characters'),
  invite: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email'),
});

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'The minimum password length is 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine(
    (data) => {
      return data.password === data.password_confirmation;
    },
    {
      message: 'Passwords do not match',
      path: ['password_confirmation'],
    },
  );

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
