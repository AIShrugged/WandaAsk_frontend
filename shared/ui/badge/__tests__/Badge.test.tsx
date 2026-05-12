import { render, screen } from '@testing-library/react';

import { Badge } from '@/shared/ui/badge/Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default').className).toContain(
      'bg-[var(--secondary)]',
    );
  });

  it('applies primary variant classes', () => {
    render(<Badge variant='primary'>Primary</Badge>);
    expect(screen.getByText('Primary').className).toContain(
      'bg-[var(--primary-soft)]',
    );
  });

  it('applies success variant classes', () => {
    render(<Badge variant='success'>Success</Badge>);
    expect(screen.getByText('Success').className).toContain(
      'bg-[var(--success-bg)]',
    );
  });

  it('applies warning variant classes', () => {
    render(<Badge variant='warning'>Warning</Badge>);
    expect(screen.getByText('Warning').className).toContain(
      'bg-[var(--warning-bg)]',
    );
  });

  it('applies danger variant classes', () => {
    render(<Badge variant='danger'>Error</Badge>);
    expect(screen.getByText('Error').className).toContain(
      'bg-[var(--danger-bg)]',
    );
  });

  it('applies destructive variant as alias for danger', () => {
    render(<Badge variant='destructive'>Error</Badge>);
    expect(screen.getByText('Error').className).toContain(
      'bg-[var(--danger-bg)]',
    );
  });

  it('applies info variant classes', () => {
    render(<Badge variant='info'>Info</Badge>);
    expect(screen.getByText('Info').className).toContain('bg-[var(--info-bg)]');
  });

  it('renders dot indicator when dot prop is true', () => {
    const { container } = render(<Badge dot>With dot</Badge>);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('does not render dot when dot prop is false', () => {
    const { container } = render(<Badge>No dot</Badge>);
    expect(
      container.querySelector('[aria-hidden="true"]'),
    ).not.toBeInTheDocument();
  });

  it('merges custom className', () => {
    render(<Badge className='mt-2'>Custom</Badge>);
    expect(screen.getByText('Custom').className).toContain('mt-2');
  });
});
