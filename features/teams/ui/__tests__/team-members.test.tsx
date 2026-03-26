import { render, screen } from '@testing-library/react';

import TeamMembers from '@/features/teams/ui/team-members';

import type { TeamProps } from '@/entities/team';

const makeTeam = (members: TeamProps['members'] = []): TeamProps => {
  return {
    id: 1,
    name: 'Engineering',
    slug: 'engineering',
    employee_count: members.length,
    members,
  };
};

describe('TeamMembers', () => {
  it('shows empty state when no members', () => {
    render(<TeamMembers data={makeTeam()} />);
    expect(screen.getByText('No members yet')).toBeInTheDocument();
  });

  it('renders member names', () => {
    render(
      <TeamMembers
        data={makeTeam([
          { id: 1, name: 'Alice Smith', email: 'alice@example.com' },
          { id: 2, name: 'Bob Jones', email: 'bob@example.com' },
        ])}
      />,
    );
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('renders member emails', () => {
    render(
      <TeamMembers
        data={makeTeam([
          { id: 1, name: 'Alice Smith', email: 'alice@example.com' },
        ])}
      />,
    );
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('shows correct initials in avatar', () => {
    render(
      <TeamMembers
        data={makeTeam([{ id: 1, name: 'John Doe', email: 'j@example.com' }])}
      />,
    );
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('shows single initial for single-word name', () => {
    render(
      <TeamMembers
        data={makeTeam([{ id: 1, name: 'Madonna', email: 'm@example.com' }])}
      />,
    );
    expect(screen.getByText('M')).toBeInTheDocument();
  });
});
