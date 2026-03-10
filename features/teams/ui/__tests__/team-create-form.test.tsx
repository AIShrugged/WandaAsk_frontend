/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TeamCreateForm from '@/features/teams/ui/team-create-form';

import type { TeamProps } from '@/entities/team';

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: jest.fn(), back: jest.fn() };
    },
  };
});

jest.mock('sonner', () => {
  return {
    toast: { success: jest.fn(), error: jest.fn() },
  };
});

jest.mock('@/features/teams/api/team', () => {
  return {
    createTeam: jest.fn().mockResolvedValue({ data: { id: 1 } }),
    updateTeam: jest.fn().mockResolvedValue({ data: {} }),
  };
});

jest.mock('@/features/teams/model/teams-store', () => {
  return {
    useTeamsStore: () => {
      return { addItem: jest.fn(), updateItem: jest.fn() };
    },
  };
});

const blankTeam = {
  id: 0,
  name: '',
  slug: '',
  employee_count: 0,
  members: [],
} as TeamProps;

const existingTeam: TeamProps = {
  id: 42,
  name: 'Engineering',
  slug: 'engineering',
  employee_count: 3,
  members: [],
};

describe('TeamCreateForm', () => {
  it('renders the name input', () => {
    render(<TeamCreateForm values={blankTeam} organization_id='1' />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders "Save" submit button', () => {
    render(<TeamCreateForm values={blankTeam} organization_id='1' />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('pre-fills name for existing team', () => {
    render(<TeamCreateForm values={existingTeam} organization_id='1' />);
    expect(screen.getByRole('textbox')).toHaveValue('Engineering');
  });

  it('submit button is disabled when form is not dirty for edit', () => {
    render(<TeamCreateForm values={existingTeam} organization_id='1' />);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('enables submit button after user edits name', async () => {
    render(<TeamCreateForm values={blankTeam} organization_id='1' />);
    await userEvent.type(screen.getByRole('textbox'), 'New Team');
    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
  });
});
