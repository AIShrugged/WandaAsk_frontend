import type { MethodologyDTO } from '@/features/methodology/model/types';
import type { DropdownOption } from '@/shared/ui/input/InputDropdown';

export const getFormFields = (teamOptions: DropdownOption[]) => [
  {
    variant: 'multiselect' as const,
    name: 'team_ids',
    label: 'Teams',
    type: 'text',
    placeholder: 'Select teams',
    options: teamOptions,
    searchable: true,
    rules: {
      required: 'At least one team is required',
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
        message: 'The maximum name length is 255 characters',
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
        message: 'The minimum length is 3 characters',
      },
    },
  },
];

export const METHODOLOGY_FIELDS: MethodologyDTO = {
  organization_id: '',
  name: '',
  text: '',
  team_ids: [],
};
