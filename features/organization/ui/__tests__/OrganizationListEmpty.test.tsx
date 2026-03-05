import { render, screen } from '@testing-library/react';

import OrganizationListEmpty from '@/features/organization/ui/organization-list-empty';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe('OrganizationListEmpty', () => {
  it('renders the invitation message', () => {
    render(<OrganizationListEmpty />);
    expect(
      screen.getByText(/you don't have any organization invitations/i),
    ).toBeInTheDocument();
  });

  it('renders a link to create organization', () => {
    render(<OrganizationListEmpty />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('create'));
  });

  it('renders the Create Organization button', () => {
    render(<OrganizationListEmpty />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('button').textContent).toContain('Organization');
  });
});
