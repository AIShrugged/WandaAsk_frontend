/* eslint-disable jsdoc/require-jsdoc */
import { render, screen, fireEvent } from '@testing-library/react';

import OrganizationDropdown from '@/features/organization/ui/organization-dropdown';

import type { OrganizationProps } from '@/entities/organization';

const mockPush = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: mockPush };
    },
  };
});

jest.mock('sonner', () => {
  return {
    toast: { success: jest.fn(), error: jest.fn() },
  };
});

jest.mock('@/features/organization/api/organization', () => {
  return {
    setActiveOrganization: jest.fn().mockResolvedValue({ ok: true }),
  };
});

const makeOrg = (
  id: number,
  name: string,
  role = 'admin',
): OrganizationProps => {
  return {
    id,
    name,
    pivot: { role },
  };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('OrganizationDropdown', () => {
  it('renders the active organization name', () => {
    render(
      <OrganizationDropdown
        organizations={[makeOrg(1, 'Acme Corp')]}
        organizationActiveId={1}
      />,
    );
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('does not show dropdown items by default', () => {
    render(
      <OrganizationDropdown
        organizations={[makeOrg(1, 'Acme Corp'), makeOrg(2, 'Beta Inc')]}
        organizationActiveId={1}
      />,
    );
    // Beta Inc should not be visible (dropdown closed)
    expect(
      screen.queryByRole('button', { name: /create/i }),
    ).not.toBeInTheDocument();
  });

  it('shows dropdown items when clicked', () => {
    render(
      <OrganizationDropdown
        organizations={[makeOrg(1, 'Acme Corp')]}
        organizationActiveId={1}
      />,
    );
    // Click the toggle button (the chevron/name row)
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText(/create/i)).toBeInTheDocument();
  });

  it('shows Create button in open dropdown', () => {
    render(
      <OrganizationDropdown
        organizations={[makeOrg(1, 'Acme Corp')]}
        organizationActiveId={1}
      />,
    );
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(
      screen.getByRole('button', { name: /\+ Create/i }),
    ).toBeInTheDocument();
  });
});
