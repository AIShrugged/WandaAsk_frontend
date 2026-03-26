import { render, screen } from '@testing-library/react';

import { FollowUpItem } from '@/features/follow-up/ui/follow-up-item';

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

const makeFollowUp = (
  overrides: Partial<TeamFollowUpDTO> = {},
): TeamFollowUpDTO => {
  return {
    id: 1,
    team_id: 10,
    methodology_id: null,
    is_deprecated: false,
    text: '',
    status: 'in_progress',
    created_at: '2024-05-20T12:00:00Z',
    updated_at: '2024-05-20T12:00:00Z',
    user: {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      email_verified_at: null,
      created_at: '2024-05-20T00:00:00Z',
      updated_at: '2024-05-20T00:00:00Z',
      is_demo: false,
    },
    calendar_event: {
      id: 7,
      title: 'Sprint Review',
      description: '',
      ends_at: '2024-05-20T11:00:00Z',
      external_id: 'ext-1',
      platform: 'google',
      required_bot: false,
      source_id: 1,
      starts_at: '2024-05-20T10:00:00Z',
      url: '',
    },
    ...overrides,
  };
};

describe('FollowUpItem', () => {
  it('renders the event title', () => {
    render(<FollowUpItem followUp={makeFollowUp()} />);
    expect(screen.getByText('Sprint Review')).toBeInTheDocument();
  });

  it('renders the organizer name', () => {
    render(<FollowUpItem followUp={makeFollowUp()} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it('renders the formatted created_at date', () => {
    render(<FollowUpItem followUp={makeFollowUp()} />);
    expect(screen.getByText('20.05.2024')).toBeInTheDocument();
  });

  it('link points to correct analysis route', () => {
    render(<FollowUpItem followUp={makeFollowUp()} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/dashboard/follow-ups/analysis/7',
    );
  });

  it('does not show deprecated badge', () => {
    render(<FollowUpItem followUp={makeFollowUp({ is_deprecated: true })} />);
    expect(
      screen.queryByText('Created with outdated methodology'),
    ).not.toBeInTheDocument();
  });
});
