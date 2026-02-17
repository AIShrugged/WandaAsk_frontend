import type { OrganizationDTO } from '@/entities/organization';

const NAME_VALIDATION_RULES = {
  required: {
    value: true,
    message: 'Organization name is required',
  },
  minLength: {
    value: 3,
    message: 'Organization name must be at least 3 characters',
  },
  maxLength: {
    value: 255,
    message: 'Organization name must not exceed 255 characters',
  },
  validate: {
    noOnlySpaces: (value: string) =>
      value.trim().length >= 3 ||
      'Organization name cannot contain only spaces',
  },
} as const;

export const ORGANIZATION_VALUES: OrganizationDTO = {
  name: '',
};

export const ORGANIZATION_FIELDS = [
  {
    variant: 'input' as const,
    name: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'Name',
    rules: NAME_VALIDATION_RULES,
  },
];
