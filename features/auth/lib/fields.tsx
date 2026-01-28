import Link from 'next/link';

import { emailField } from '@/shared/lib/fields';

import type { RegisterDTO } from '@/features/auth/model/types';

const passwordField = {
  variant: 'inputPassword' as const,
  name: 'password',
  label: 'Password',
  type: 'input',
  placeholder: 'Enter password',
  rules: {
    required: 'Password is required',
    minLength: {
      value: 6,
      message: 'The minimum password length is 6 characters',
    },
    /*   pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Must contain uppercase, lowercase and number',
    },*/
  },
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
    rules: {
      required: 'Name is required',
      minLength: {
        value: 2,
        message: 'The minimum name length is 2 characters',
      },
    },
  },
  emailField,
  passwordField,
  {
    variant: 'checkbox' as const,
    name: 'acceptTerms',
    label: 'I agree to',
    labelExtra: (
      <Link className={'text-primary'} href={''}>
        Terms & Privacy Policy
      </Link>
    ),
    type: 'checkbox',
    rules: {
      required: '',
    },
  },
];

export const REGISTER_FIELDS_VALUES: RegisterDTO = {
  name: '',
  email: '',
  password: '',
  acceptTerms: false,
};
