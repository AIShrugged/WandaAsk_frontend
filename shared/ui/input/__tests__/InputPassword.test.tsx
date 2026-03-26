import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InputPassword from '@/shared/ui/input/InputPassword';

jest.mock('motion/react-client', () => {
  return {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => {
      return <div {...props}>{children}</div>;
    },
  };
});

describe('InputPassword', () => {
  it('renders a password input by default', () => {
    const { container } = render(
      <InputPassword value='' onChange={jest.fn()} />,
    );

    expect(container.querySelector('input')).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('does not show toggle button when value is empty', () => {
    render(<InputPassword value='' onChange={jest.fn()} />);
    expect(
      screen.queryByRole('button', { name: /password/i }),
    ).not.toBeInTheDocument();
  });

  it('shows toggle button when value has at least one character', () => {
    render(<InputPassword value='x' onChange={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: /show password/i }),
    ).toBeInTheDocument();
  });

  it('toggles type to text when Show password is clicked', async () => {
    const { rerender } = render(
      <InputPassword value='secret' onChange={jest.fn()} />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /show password/i }),
    );
    rerender(<InputPassword value='secret' onChange={jest.fn()} />);
    // After toggle the button aria-label should change to "Hide password"
    expect(
      await screen.findByRole('button', { name: /hide password/i }),
    ).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<InputPassword value='' onChange={jest.fn()} label='Password' />);
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('forwards value to underlying input', () => {
    const { container } = render(
      <InputPassword value='mysecret' onChange={jest.fn()} />,
    );
    const input = container.querySelector('input');

    expect(input).toHaveValue('mysecret');
  });
});
