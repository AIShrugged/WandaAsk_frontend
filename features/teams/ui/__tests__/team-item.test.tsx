/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import { TeamItem } from '@/features/teams/ui/team-item';

import type { TeamActionType, TeamProps } from '@/entities/team';

// TeamActions uses next/navigation hooks and Zustand — mock it
jest.mock('@/features/teams/ui/team-actions', () => {
  return {
    TeamActions: ({
      id,
      actions,
    }: {
      id: number;
      actions: TeamActionType[];
    }) => {
      return (
        <div
          data-testid='team-actions'
          data-id={id}
          data-actions={actions.join(',')}
        />
      );
    },
  };
});

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
    }: {
      children: React.ReactNode;
      href: string;
    }) => {
      return <a href={href}>{children}</a>;
    },
  };
});

const makeTeam = (overrides?: Partial<TeamProps>): TeamProps => {
  return {
    id: 1,
    name: 'Engineering',
    slug: 'engineering',
    employee_count: 5,
    members: [],
    ...overrides,
  };
};

describe('TeamItem', () => {
  it('renders the team name', () => {
    render(<TeamItem team={makeTeam()} actions={[]} href='/dashboard/teams' />);
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('shows employee count when > 0', () => {
    render(
      <TeamItem
        team={makeTeam({ employee_count: 3 })}
        actions={[]}
        href='/dashboard/teams'
      />,
    );
    expect(screen.getByText('3 employees')).toBeInTheDocument();
  });

  it('shows singular "employee" for count 1', () => {
    render(
      <TeamItem
        team={makeTeam({ employee_count: 1 })}
        actions={[]}
        href='/dashboard/teams'
      />,
    );
    expect(screen.getByText('1 employee')).toBeInTheDocument();
  });

  it('shows "No employees" message when count is 0', () => {
    render(
      <TeamItem
        team={makeTeam({ employee_count: 0 })}
        actions={[]}
        href='/dashboard/teams'
      />,
    );
    expect(screen.getByText('No employees in Engineering')).toBeInTheDocument();
  });

  it('builds the correct href from team id', () => {
    render(
      <TeamItem
        team={makeTeam({ id: 42 })}
        actions={[]}
        href='/dashboard/teams'
      />,
    );
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/dashboard/teams/42',
    );
  });

  it('renders TeamActions with correct props', () => {
    render(
      <TeamItem
        team={makeTeam({ id: 7 })}
        actions={['add-member', 'delete']}
        href='/dashboard/teams'
      />,
    );
    const actions = screen.getByTestId('team-actions');

    expect(actions).toHaveAttribute('data-id', '7');
    expect(actions).toHaveAttribute('data-actions', 'add-member,delete');
  });
});
