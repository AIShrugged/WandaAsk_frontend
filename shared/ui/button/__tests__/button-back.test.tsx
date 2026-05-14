import { render, screen, fireEvent } from '@testing-library/react';

import ButtonBack from '@/shared/ui/button/button-back';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { back: mockBack, push: mockPush };
    },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(globalThis, 'history', {
    value: { length: 2 },
    writable: true,
  });
});

describe('ButtonBack', () => {
  it('renders a button with accessible label', () => {
    render(<ButtonBack />);
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('calls router.back when clicked', () => {
    render(<ButtonBack />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders a chevron icon', () => {
    const { container } = render(<ButtonBack />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('calls router.push with href when href prop is provided', () => {
    render(<ButtonBack href='/dashboard/issues/kanban?organization_id=2' />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockPush).toHaveBeenCalledWith(
      '/dashboard/issues/kanban?organization_id=2',
    );
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('calls router.push with fallbackHref when history length is 1', () => {
    Object.defineProperty(globalThis, 'history', {
      value: { length: 1 },
      writable: true,
    });
    render(<ButtonBack fallbackHref='/dashboard/issues/kanban' />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/issues/kanban');
    expect(mockBack).not.toHaveBeenCalled();
  });
});
