import { render, screen } from '@testing-library/react';

import MethodologyItem from '@/features/methodology/ui/methodology-item';

import type { MethodologyProps } from '@/features/methodology/model/types';

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
    }: React.PropsWithChildren<{ href: string }>) => {
      return <a href={href}>{children}</a>;
    },
  };
});

jest.mock('@/features/methodology/ui/methodologies-action', () => {
  return {
    MethodologiesAction: ({
      methodology,
    }: {
      methodology: MethodologyProps;
    }) => {
      return <div data-testid='methodology-action' data-id={methodology.id} />;
    },
  };
});

const makeMethodology = (
  overrides: Partial<MethodologyProps> = {},
): MethodologyProps => {
  return {
    id: 1,
    name: 'Sprint Review Protocol',
    text: 'Description',
    organization_id: 'org-1',
    team_ids: [],
    is_default: false,
    teams: [],
    ...overrides,
  };
};

describe('MethodologyItem', () => {
  it('renders the methodology name', () => {
    render(<MethodologyItem methodology={makeMethodology()} />);
    expect(screen.getByText('Sprint Review Protocol')).toBeInTheDocument();
  });

  it('link points to the correct methodology route', () => {
    render(<MethodologyItem methodology={makeMethodology({ id: 5 })} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/dashboard/methodology/5',
    );
  });

  it('renders MethodologiesAction with correct methodology', () => {
    render(<MethodologyItem methodology={makeMethodology({ id: 7 })} />);
    expect(screen.getByTestId('methodology-action')).toHaveAttribute(
      'data-id',
      '7',
    );
  });

  it('applies border-b class for visual separation', () => {
    const { container } = render(
      <MethodologyItem methodology={makeMethodology()} />,
    );

    expect(container.firstChild).toHaveClass('border-b');
  });
});
