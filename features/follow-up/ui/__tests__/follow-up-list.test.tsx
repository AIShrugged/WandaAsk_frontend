import { render, screen } from '@testing-library/react';

import { FollowUpList } from '@/features/follow-up/ui/follow-up-list';

import type { TeamFollowUpDTO } from '@/entities/team';

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

const makeFollowUp = (id: number, title: string): TeamFollowUpDTO => {
  return {
    id,
    team_id: 1,
    methodology_id: null,
    is_deprecated: false,
    text: '',
    status: 'in_progress',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user: {
      id: 1,
      name: 'Bob',
      email: 'bob@example.com',
      email_verified_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_demo: false,
    },
    calendar_event: {
      id,
      title,
      description: '',
      ends_at: '2024-01-01T10:00:00Z',
      external_id: `ext-${id}`,
      platform: 'google',
      required_bot: false,
      source_id: 1,
      starts_at: '2024-01-01T09:00:00Z',
      url: '',
    },
  };
};

describe('FollowUpList', () => {
  it('renders empty state for an empty array', () => {
    render(<FollowUpList followUps={[]} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('No follow-ups yet')).toBeInTheDocument();
  });

  it('renders one item', () => {
    render(<FollowUpList followUps={[makeFollowUp(1, 'Kickoff')]} />);
    expect(screen.getByText('Kickoff')).toBeInTheDocument();
  });

  it('renders multiple items', () => {
    render(
      <FollowUpList
        followUps={[
          makeFollowUp(1, 'Kickoff'),
          makeFollowUp(2, 'Retrospective'),
          makeFollowUp(3, 'Demo'),
        ]}
      />,
    );
    expect(screen.getByText('Kickoff')).toBeInTheDocument();
    expect(screen.getByText('Retrospective')).toBeInTheDocument();
    expect(screen.getByText('Demo')).toBeInTheDocument();
  });

  it('renders the correct number of links', () => {
    render(
      <FollowUpList followUps={[makeFollowUp(1, 'A'), makeFollowUp(2, 'B')]} />,
    );
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});
