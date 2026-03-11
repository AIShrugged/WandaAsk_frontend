/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import React from 'react';

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

jest.mock('lucide-react', () => {
  return {
    Trash: () => {
      return <span data-testid='trash-icon' />;
    },
    ArrowLeftRight: () => {
      return <span data-testid='arrow-icon' />;
    },
  };
});

jest.mock('@/shared/ui/button/Button', () => {
  return {
    Button: ({ children }: { children: React.ReactNode }) => {
      return <button>{children}</button>;
    },
  };
});

import TeamCreate from '@/features/teams/ui/team-create';
import TeamMember from '@/features/teams/ui/team-member';
import TeamMemberTransferForm from '@/features/teams/ui/team-member-transfer-form';

import type { TeamProps } from '@/entities/team';

const makeMember = (overrides: Partial<TeamProps> = {}): TeamProps => {
  return {
    id: 1,
    name: 'Alice',
    slug: 'alice',
    employee_count: 5,
    members: [],
    ...overrides,
  };
};

describe('TeamMemberTransferForm', () => {
  it('renders placeholder text', () => {
    render(<TeamMemberTransferForm />);
    expect(screen.getByText('TeamMemberTransferForm')).toBeInTheDocument();
  });
});

describe('TeamCreate', () => {
  it('renders a "Create" button', () => {
    render(<TeamCreate />);
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('links to the teams create route', () => {
    render(<TeamCreate />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/dashboard/teams/create',
    );
  });
});

describe('TeamMember', () => {
  it('renders the member name', () => {
    render(<TeamMember member={makeMember()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders trash and transfer icons', () => {
    render(<TeamMember member={makeMember()} />);
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    expect(screen.getByTestId('arrow-icon')).toBeInTheDocument();
  });

  it('renders with a different member name', () => {
    render(<TeamMember member={makeMember({ name: 'Bob' })} />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});
