/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import OrganizationList from '@/features/organization/ui/organization-list';

import type { OrganizationProps } from '@/entities/organization';

jest.mock('@/features/organization/api/organization', () => {
  return {
    selectOrganizationAction: jest.fn(),
  };
});

const makeOrg = (
  overrides: Partial<OrganizationProps> = {},
): OrganizationProps => {
  return {
    id: 1,
    name: 'Acme Corp',
    pivot: { role: 'admin' },
    ...overrides,
  };
};

describe('OrganizationList', () => {
  it('renders organization name', async () => {
    render(await OrganizationList({ organizations: [makeOrg()] }));
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders the user role', async () => {
    render(await OrganizationList({ organizations: [makeOrg()] }));
    expect(screen.getByText('Your role: admin')).toBeInTheDocument();
  });

  it('renders all organizations', async () => {
    render(
      await OrganizationList({
        organizations: [
          makeOrg({ id: 1, name: 'Alpha' }),
          makeOrg({ id: 2, name: 'Beta' }),
        ],
      }),
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows fallback when organizations is falsy', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(await OrganizationList({ organizations: null as any }));
    expect(screen.getByText('still no organizations')).toBeInTheDocument();
  });
});
