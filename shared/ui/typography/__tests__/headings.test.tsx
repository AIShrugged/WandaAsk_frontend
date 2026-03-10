import { render, screen } from '@testing-library/react';

import { H1 } from '@/shared/ui/typography/H1';
import { H2 } from '@/shared/ui/typography/H2';
import { H3 } from '@/shared/ui/typography/H3';

describe('H1', () => {
  it('renders children as an h1 element', () => {
    render(<H1>Page Title</H1>);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page Title' }),
    ).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<H1 className='custom'>Title</H1>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('custom');
  });

  it('applies bold and text-3xl classes', () => {
    render(<H1>Title</H1>);
    const el = screen.getByRole('heading', { level: 1 });

    expect(el).toHaveClass('font-bold');
    expect(el).toHaveClass('text-3xl');
  });
});

describe('H2', () => {
  it('renders children as an h2 element', () => {
    render(<H2>Section Title</H2>);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Section Title' }),
    ).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<H2 className='extra'>Title</H2>);
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('extra');
  });
});

describe('H3', () => {
  it('renders children as an h3 element', () => {
    render(<H3>Subsection</H3>);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Subsection' }),
    ).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<H3 className='small'>Sub</H3>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveClass('small');
  });
});
