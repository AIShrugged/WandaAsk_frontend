import { render, screen, fireEvent } from '@testing-library/react';

import MobileSidebar from '@/widgets/layout/ui/mobile-sidebar';

jest.mock('@/shared/ui/brand', () => {
  return {
    TribesLogo: () => {
      return <div data-testid='tribes-logo' />;
    },
  };
});

describe('MobileSidebar', () => {
  it('renders children', () => {
    render(
      <MobileSidebar>
        <nav>Navigation</nav>
      </MobileSidebar>,
    );
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('renders menu button', () => {
    render(
      <MobileSidebar>
        <div />
      </MobileSidebar>,
    );
    expect(
      screen.getByRole('button', { name: /open navigation/i }),
    ).toBeInTheDocument();
  });

  it('sidebar is initially hidden', () => {
    render(
      <MobileSidebar>
        <div />
      </MobileSidebar>,
    );
    const sidebar = screen.getByRole('dialog', { hidden: true });

    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  });

  it('opens sidebar on menu button click', () => {
    render(
      <MobileSidebar>
        <div />
      </MobileSidebar>,
    );
    fireEvent.click(screen.getByRole('button', { name: /open navigation/i }));
    const sidebar = screen.getByRole('dialog');

    expect(sidebar).toHaveAttribute('aria-hidden', 'false');
  });

  it('closes sidebar on close button click', () => {
    render(
      <MobileSidebar>
        <div />
      </MobileSidebar>,
    );
    fireEvent.click(screen.getByRole('button', { name: /open navigation/i }));
    fireEvent.click(screen.getByRole('button', { name: /close navigation/i }));
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('closes sidebar on Escape key', () => {
    render(
      <MobileSidebar>
        <div />
      </MobileSidebar>,
    );
    fireEvent.click(screen.getByRole('button', { name: /open navigation/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('renders Tribes logo inside drawer', () => {
    render(
      <MobileSidebar>
        <div />
      </MobileSidebar>,
    );
    expect(screen.getByTestId('tribes-logo')).toBeInTheDocument();
  });
});
