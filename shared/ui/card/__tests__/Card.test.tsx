import { render, screen } from '@testing-library/react';

import Card from '@/shared/ui/card/Card';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <span>Hello</span>
      </Card>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    const { container } = render(<Card>Content</Card>);

    const div = container.firstChild as HTMLElement;

    expect(div).toHaveClass(
      'bg-card',
      'border',
      'border-border',
      'shadow-card',
    );
  });

  it('merges custom className', () => {
    const { container } = render(<Card className='p-6'>Content</Card>);

    expect(container.firstChild).toHaveClass('p-6');
  });

  it('renders without className prop', () => {
    expect(() => {
      return render(<Card>Content</Card>);
    }).not.toThrow();
  });
});
