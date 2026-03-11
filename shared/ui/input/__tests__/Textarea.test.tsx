import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import Textarea from '@/shared/ui/input/textarea';

const user = userEvent.setup({ delay: null });

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders a label when provided', () => {
    render(<Textarea label='Description' />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('label is associated with the textarea via htmlFor', () => {
    render(<Textarea label='Notes' />);
    const label = screen.getByText('Notes');

    const textarea = screen.getByRole('textbox');

    expect(label).toHaveAttribute('for', textarea.id);
  });

  it('does not render a label when not provided', () => {
    const { container } = render(<Textarea />);

    expect(container.querySelector('label')).toBeNull();
  });

  it('renders a string error message', () => {
    render(<Textarea error='This field is required' />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('does not render error text when error is boolean', () => {
    const { container } = render(<Textarea error={true} />);

    expect(container.querySelector('span.text-destructive')).toBeNull();
  });

  it('marks textarea as aria-invalid when error is set', () => {
    render(<Textarea error='Bad input' />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('calls onFocus handler', async () => {
    const onFocus = jest.fn();

    render(<Textarea onFocus={onFocus} />);
    await user.click(screen.getByRole('textbox'));
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('calls onBlur handler', async () => {
    const onBlur = jest.fn();

    render(<Textarea onBlur={onBlur} />);
    await user.click(screen.getByRole('textbox'));
    await user.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('calls onChange handler when typing', async () => {
    const onChange = jest.fn();

    render(<Textarea onChange={onChange} value='' />);
    await user.type(screen.getByRole('textbox'), 'hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('renders with controlled value', () => {
    render(<Textarea value='preset text' onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('preset text');
  });

  it('forwards ref to the underlying textarea', () => {
    const ref = React.createRef<HTMLTextAreaElement>();

    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('applies containerClassName', () => {
    const { container } = render(
      <Textarea containerClassName='my-container' />,
    );

    expect(container.firstChild).toHaveClass('my-container');
  });

  it('label floats when textarea has a value', () => {
    render(<Textarea label='Subject' value='some text' onChange={jest.fn()} />);
    const label = screen.getByText('Subject');

    expect(label).toHaveClass('-translate-y-7');
  });

  it('label does not float when textarea is empty and not focused', () => {
    render(<Textarea label='Subject' value='' onChange={jest.fn()} />);
    const label = screen.getByText('Subject');

    expect(label).not.toHaveClass('-translate-y-7');
  });
});
