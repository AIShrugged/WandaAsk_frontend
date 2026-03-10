import { render, screen, fireEvent } from '@testing-library/react';

import ButtonClose from '@/shared/ui/button/button-close';

describe('ButtonClose', () => {
  it('renders a button', () => {
    render(<ButtonClose close={jest.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls close when clicked', () => {
    const close = jest.fn();

    render(<ButtonClose close={close} />);
    fireEvent.click(screen.getByRole('button'));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('renders close icon', () => {
    const { container } = render(<ButtonClose close={jest.fn()} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
