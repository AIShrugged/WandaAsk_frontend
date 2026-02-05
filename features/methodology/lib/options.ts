import type { MethodologyDTO } from '@/features/methodology/model/types';
import type { DropdownOption } from '@/shared/ui/input/InputDropdown';

export const getFormFields = (organizationOptions: DropdownOption[]) => [
  {
    variant: 'select' as const,
    name: 'organization_id',
    label: 'Organization',
    type: 'text',
    placeholder: 'Select organization',
    options: organizationOptions,
    rules: {
      required: 'Organization is required',
    },
  },
  {
    variant: 'input' as const,
    name: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'Enter name',
    rules: {
      required: 'Name is required',
      minLength: {
        value: 3,
        message: 'The minimum name length is 3 characters',
      },
      maxLength: {
        value: 255,
        message: 'The minimum name length is 255 characters',
      },
    },
  },
  {
    variant: 'inputTextarea' as const,
    name: 'text',
    type: 'text',
    label: 'Insert methodology',
    placeholder: 'Insert methodology',
    rows: 5,
    rules: {
      required: 'Methodology is required',
      minLength: {
        value: 3,
        message: 'The minimum name length is 3 characters',
      },
    },
  },
];

export const METHODOLOGY_FIELDS: MethodologyDTO = {
  organization_id: '',
  name: '',
  text: '',
};
