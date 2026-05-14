import Link from 'next/link';

import { emailField } from '@/shared/lib/fields';

import type { RegisterInput } from '@/features/auth/model/schemas';

const passwordField = {
  variant: 'inputPassword' as const,
  name: 'password',
  label: 'Password',
  type: 'input',
  placeholder: 'Enter password',
};

export const SIGN_IN_FIELDS = [emailField, passwordField];

export const SIGN_IN_VALUES = {
  email: '',
  password: '',
};

export const REGISTER_FIELDS = [
  {
    variant: 'input' as const,
    name: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'Name',
  },
  emailField,
  passwordField,
  {
    variant: 'checkbox' as const,
    name: 'acceptTerms',
    label: 'I agree to',
    labelExtra: (
      <Link className='cursor-pointer text-primary' href='/terms'>
        Terms &amp; Privacy Policy
      </Link>
    ),
    type: 'checkbox',
  },
];

export const REGISTER_FIELDS_VALUES: Omit<RegisterInput, 'acceptTerms'> & {
  acceptTerms: boolean;
} = {
  name: '',
  email: '',
  password: '',
  acceptTerms: false,
};
