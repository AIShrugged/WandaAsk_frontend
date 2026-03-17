import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';

import { EmptyState } from '@/shared/ui/feedback/empty-state';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState icon={Users} title='No teams yet' />);
    expect(screen.getByText('No teams yet')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        icon={Users}
        title='Empty'
        description='Create one to start'
      />,
    );
    expect(screen.getByText('Create one to start')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    const { queryByText } = render(<EmptyState icon={Users} title='Empty' />);

    expect(queryByText('Create one to start')).not.toBeInTheDocument();
  });

  it('has role="status"', () => {
    render(<EmptyState icon={Users} title='Empty' />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the icon element', () => {
    const { container } = render(<EmptyState icon={Users} title='Empty' />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('title has text-foreground class', () => {
    render(<EmptyState icon={Users} title='No items' />);
    const title = screen.getByText('No items');

    expect(title).toHaveClass('text-foreground');
  });
});
