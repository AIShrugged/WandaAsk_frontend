import { render, screen } from '@testing-library/react';

import Avatar from '@/shared/ui/common/avatar';

describe('Avatar', () => {
  it('renders children', () => {
    render(<Avatar>AB</Avatar>);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('has role="img"', () => {
    render(<Avatar>AB</Avatar>);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('applies md size by default (w-10 h-10)', () => {
    render(<Avatar>X</Avatar>);
    expect(screen.getByRole('img')).toHaveClass('w-10', 'h-10');
  });

  it('applies xs size classes', () => {
    render(<Avatar size='xs'>X</Avatar>);
    expect(screen.getByRole('img')).toHaveClass('w-6', 'h-6');
  });

  it('applies sm size classes', () => {
    render(<Avatar size='sm'>X</Avatar>);
    expect(screen.getByRole('img')).toHaveClass('w-8', 'h-8');
  });

  it('applies lg size classes', () => {
    render(<Avatar size='lg'>X</Avatar>);
    expect(screen.getByRole('img')).toHaveClass('w-12', 'h-12');
  });

  it('applies xl size classes', () => {
    render(<Avatar size='xl'>X</Avatar>);
    expect(screen.getByRole('img')).toHaveClass('w-16', 'h-16');
  });

  it('merges custom className', () => {
    render(<Avatar className='border-2'>X</Avatar>);
    expect(screen.getByRole('img')).toHaveClass('border-2');
  });

  it('is always a rounded-full circle', () => {
    render(<Avatar>X</Avatar>);
    expect(screen.getByRole('img')).toHaveClass('rounded-full');
  });
});
