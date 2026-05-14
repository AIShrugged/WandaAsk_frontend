import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email('Please enter a valid email').max(254, 'Email is too long'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'The minimum password length is 8 characters')
    .max(72, 'Password is too long'),
});

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'The minimum name length is 2 characters')
    .max(255, 'Name is too long')
    .regex(/^\S.*\S$|^\S$/, 'Name cannot start or end with spaces'),
  email: z.email('Please enter a valid email').max(254, 'Email is too long'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'The minimum password length is 8 characters')
    .max(72, 'Password is too long'),
  invite: z.string().max(128).optional(),
  acceptTerms: z.literal(true, {
    error: 'You must accept the Terms & Privacy Policy',
  }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email').max(254, 'Email is too long'),
});

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'The minimum password length is 8 characters')
      .max(72, 'Password is too long'),
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
