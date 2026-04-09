import { render, screen } from '@testing-library/react';

import { Badge } from '@/shared/ui/badge/Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default').className).toContain('bg-secondary');
  });

  it('applies primary variant classes', () => {
    render(<Badge variant='primary'>Primary</Badge>);
    expect(screen.getByText('Primary').className).toContain('bg-primary');
  });

  it('applies success variant classes', () => {
    render(<Badge variant='success'>Success</Badge>);
    expect(screen.getByText('Success').className).toContain('bg-accent/15');
  });

  it('applies warning variant classes', () => {
    render(<Badge variant='warning'>Warning</Badge>);
    expect(screen.getByText('Warning').className).toContain('bg-yellow-500/15');
  });

  it('applies destructive variant classes', () => {
    render(<Badge variant='destructive'>Error</Badge>);
    expect(screen.getByText('Error').className).toContain('bg-destructive');
  });

  it('merges custom className', () => {
    render(<Badge className='mt-2'>Custom</Badge>);
    expect(screen.getByText('Custom').className).toContain('mt-2');
  });
});
