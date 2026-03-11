import { render, screen } from '@testing-library/react';
import React from 'react';

import InputTextarea from '@/shared/ui/input/InputTextarea';

describe('InputTextarea', () => {
  it('renders a textarea element', () => {
    render(<InputTextarea name='bio' />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('forwards placeholder prop', () => {
    render(<InputTextarea name='bio' placeholder='Tell us about yourself' />);
    expect(
      screen.getByPlaceholderText('Tell us about yourself'),
    ).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<InputTextarea name='bio' label='Bio' />);
    expect(screen.getByText('Bio')).toBeInTheDocument();
  });

  it('displays an error message', () => {
    render(<InputTextarea name='bio' error='Required' />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renders with a controlled value', () => {
    render(<InputTextarea name='bio' value='Hello' onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('Hello');
  });
});
