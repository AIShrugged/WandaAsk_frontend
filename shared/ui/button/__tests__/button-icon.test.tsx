import { render, screen, fireEvent } from '@testing-library/react';

import { ButtonIcon } from '@/shared/ui/button/button-icon';

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
    }: React.PropsWithChildren<{ href: string }>) => {
      return <a href={href}>{children}</a>;
    },
  };
});

describe('ButtonIcon', () => {
  it('renders as button when no href', () => {
    render(<ButtonIcon aria-label='Action' icon={<span>X</span>} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders as link when href is provided', () => {
    render(
      <ButtonIcon
        aria-label='Settings'
        icon={<span>X</span>}
        href='/settings'
      />,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/settings');
  });

  it('calls onClickAction when clicked', () => {
    const onClick = jest.fn();

    render(
      <ButtonIcon
        aria-label='Click me'
        icon={<span>X</span>}
        onClickAction={onClick}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<ButtonIcon aria-label='Disabled' icon={<span>X</span>} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onClickAction when disabled', () => {
    const onClick = jest.fn();

    render(
      <ButtonIcon
        aria-label='Disabled click'
        icon={<span>X</span>}
        onClickAction={onClick}
        disabled
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders as button instead of link when disabled with href', () => {
    render(
      <ButtonIcon
        aria-label='Disabled link'
        icon={<span>X</span>}
        href='/settings'
        disabled
      />,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
