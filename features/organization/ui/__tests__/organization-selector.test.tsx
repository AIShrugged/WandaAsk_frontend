/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import OrganizationSelector from '@/features/organization/ui/organization-selector';

jest.mock('@/features/organization/api/organization', () => {
  return {
    getOrganizations: jest.fn(),
  };
});

jest.mock('next/headers', () => {
  return {
    cookies: jest.fn().mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: '5' }),
    }),
  };
});

jest.mock('@/features/organization/ui/organization-dropdown', () => {
  return {
    __esModule: true,
    default: ({
      organizationActiveId,
      organizations,
    }: {
      organizationActiveId: number | null;
      organizations: { id: number; name: string }[];
    }) => {
      return (
        <div data-testid='org-dropdown'>
          active:{organizationActiveId} count:{organizations.length}
        </div>
      );
    },
  };
});

const { getOrganizations } = jest.requireMock(
  '@/features/organization/api/organization',
);

describe('OrganizationSelector', () => {
  it('renders OrganizationDropdown with organizations and active id', async () => {
    getOrganizations.mockResolvedValueOnce({
      data: [
        { id: 1, name: 'Org A' },
        { id: 5, name: 'Org B' },
      ],
    });

    render(await OrganizationSelector());

    const dropdown = screen.getByTestId('org-dropdown');

    expect(dropdown).toHaveTextContent('active:5');
    expect(dropdown).toHaveTextContent('count:2');
  });

  it('returns null when organizations data is null', async () => {
    getOrganizations.mockResolvedValueOnce({ data: null });

    const result = await OrganizationSelector();

    expect(result).toBeNull();
  });

  it('converts string cookie value to number for active id', async () => {
    getOrganizations.mockResolvedValueOnce({
      data: [{ id: 3, name: 'Org C' }],
    });

    render(await OrganizationSelector());

    expect(screen.getByTestId('org-dropdown')).toHaveTextContent('active:5');
  });
});
