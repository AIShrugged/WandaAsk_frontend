import { z } from 'zod';

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
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
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'The minimum password length is 6 characters'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
