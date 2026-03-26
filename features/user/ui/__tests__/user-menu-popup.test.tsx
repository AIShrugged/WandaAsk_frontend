import { render, screen, fireEvent } from '@testing-library/react';

import { UserMenuPopup } from '@/features/user/ui/user-menu-popup';

const mockPush = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: mockPush };
    },
  };
});

jest.mock('@/shared/api/session', () => {
  return {
    logout: jest.fn().mockResolvedValue(),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('UserMenuPopup', () => {
  it('renders Profile menu item', () => {
    render(<UserMenuPopup close={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
  });

  it('renders Log out menu item', () => {
    render(<UserMenuPopup close={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('navigates to profile on Profile click', async () => {
    render(<UserMenuPopup close={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
    // Wait for transition
    await new Promise((r) => {
      return setTimeout(r, 50);
    });
    expect(mockPush).toHaveBeenCalledWith('/dashboard/profile');
  });

  it('calls close when Log out is clicked', async () => {
    const close = jest.fn();

    render(<UserMenuPopup close={close} />);
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    await new Promise((r) => {
      return setTimeout(r, 50);
    });
    expect(close).toHaveBeenCalled();
  });
});
