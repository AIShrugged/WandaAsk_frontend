/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import MethodologyCreate from '@/features/methodology/ui/methodology-create';

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

describe('MethodologyCreate', () => {
  it('renders a link', () => {
    render(<MethodologyCreate />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('link points to methodology create route', () => {
    render(<MethodologyCreate />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/dashboard/methodology/create',
    );
  });

  it('renders "Add methodology" text', () => {
    render(<MethodologyCreate />);
    expect(screen.getByText(/methodology/i)).toBeInTheDocument();
  });
});
