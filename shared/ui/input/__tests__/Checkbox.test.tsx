import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Checkbox from '@/shared/ui/input/Checkbox';

jest.mock('motion/react-client', () => {
  return {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => {
      return <div {...props}>{children}</div>;
    },
  };
});

describe('Checkbox', () => {
  it('renders an unchecked checkbox by default', () => {
    render(<Checkbox onChange={jest.fn()} value='' />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('renders as checked when value is truthy', () => {
    render(<Checkbox onChange={jest.fn()} value='true' />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('renders label text when provided', () => {
    render(<Checkbox onChange={jest.fn()} value='' label='Accept terms' />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('renders labelExtra content', () => {
    render(
      <Checkbox
        onChange={jest.fn()}
        value=''
        labelExtra={<span>Extra info</span>}
      />,
    );
    expect(screen.getByText('Extra info')).toBeInTheDocument();
  });

  it('shows the check icon when checked', () => {
    const { container } = render(
      <Checkbox onChange={jest.fn()} value='true' />,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show the check icon when unchecked', () => {
    const { container } = render(<Checkbox onChange={jest.fn()} value='' />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('calls onChange when clicked', async () => {
    const onChange = jest.fn();

    render(<Checkbox onChange={onChange} value='' />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalled();
  });

  it('applies destructive border class when error is provided', () => {
    const { container } = render(
      <Checkbox onChange={jest.fn()} value='' error='Required' />,
    );
    const input = container.querySelector('input');

    expect(input?.className).toContain('border-destructive');
  });

  it('applies default border class when no error', () => {
    const { container } = render(<Checkbox onChange={jest.fn()} value='' />);
    const input = container.querySelector('input');

    expect(input?.className).toContain('border-border');
  });
});
