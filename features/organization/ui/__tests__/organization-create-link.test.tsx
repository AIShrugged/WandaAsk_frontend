import { render, screen } from '@testing-library/react';

import OrganizationCreateLink from '@/features/organization/ui/organization-create-link';

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

describe('OrganizationCreateLink', () => {
  it('renders link with "new organization" text', () => {
    render(<OrganizationCreateLink />);
    expect(
      screen.getByRole('link', { name: /new organization/i }),
    ).toBeInTheDocument();
  });

  it('link points to organization/create route', () => {
    render(<OrganizationCreateLink />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'organization/create',
    );
  });
});
