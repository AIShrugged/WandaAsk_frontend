import { render, screen } from '@testing-library/react';

import PageHeader from '@/widgets/layout/ui/page-header';

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { back: jest.fn() };
    },
  };
});

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title='Team Overview' />);
    expect(
      screen.getByRole('heading', { name: 'Team Overview' }),
    ).toBeInTheDocument();
  });

  it('does not render back button by default', () => {
    render(<PageHeader title='Teams' />);
    expect(
      screen.queryByRole('button', { name: /back/i }),
    ).not.toBeInTheDocument();
  });

  it('renders back button when hasButtonBack is true', () => {
    render(<PageHeader title='Detail' hasButtonBack />);
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });
});
