import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Input from '@/shared/ui/input/Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input value='' onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows the label', () => {
    render(<Input value='' label='Email' onChange={jest.fn()} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input value='' placeholder='Enter email' onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const onChange = jest.fn();
    render(<Input value='' onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows string error message', () => {
    render(<Input value='' error='Email is required' onChange={jest.fn()} />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('does not show error message when error is boolean true', () => {
    render(<Input value='' label='Email' error={true} onChange={jest.fn()} />);
    // boolean error applies styling but shows no text
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input value='' error='Required' onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when no error', () => {
    render(<Input value='' onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
  });

  it('renders startAdornment', () => {
    render(
      <Input value='' onChange={jest.fn()} startAdornment={<span>@</span>} />,
    );
    expect(screen.getByText('@')).toBeInTheDocument();
  });

  it('renders endAdornment', () => {
    render(
      <Input value='' onChange={jest.fn()} endAdornment={<span>units</span>} />,
    );
    expect(screen.getByText('units')).toBeInTheDocument();
  });

  it('is disabled when disabled prop passed', () => {
    render(<Input value='' disabled onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});