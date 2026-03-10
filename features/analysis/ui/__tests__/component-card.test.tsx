import { render, screen } from '@testing-library/react';

import ComponentCard from '@/features/analysis/ui/component-card';

describe('ComponentCard', () => {
  it('renders children', () => {
    render(
      <ComponentCard>
        <span>Card content</span>
      </ComponentCard>,
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies card styling classes', () => {
    const { container } = render(<ComponentCard>Content</ComponentCard>);

    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('rounded-[var(--radius-card)]');
  });
});
