import { render, screen } from '@testing-library/react';

import { H4 } from '@/shared/ui/typography/H4';

describe('H4', () => {
  it('renders children as h4', () => {
    render(<H4>Section title</H4>);
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(
      'Section title',
    );
  });

  it('applies custom className', () => {
    render(<H4 className='custom-class'>Title</H4>);
    expect(screen.getByRole('heading', { level: 4 })).toHaveClass(
      'custom-class',
    );
  });

  it('includes base typography classes', () => {
    render(<H4>Title</H4>);
    const el = screen.getByRole('heading', { level: 4 });

    expect(el).toHaveClass('text-lg', 'font-medium');
  });
});
