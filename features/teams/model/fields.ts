import { emailField } from '@/shared/lib/fields';

import type { TeamAddMemberDTO, TeamCreateDTO } from '@/entities/team';

export const TEAM_CREATE_FIELDS = [
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
];

export const TEAM_CREATE_VALUES: TeamCreateDTO = {
  name: '',
};

export const TEAM_MEMBER_ADD_FIELDS = [emailField];

export const TEAM_MEMBER_ADD_VALUES: TeamAddMemberDTO = {
  email: '',
};
