/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UserInfo from '@/features/user/ui/user-info';

import type { UserProps } from '@/entities/user';

const mockOpen = jest.fn();

// Mock popup context — UserInfo calls open() on click
jest.mock('@/shared/hooks/use-popup', () => {
  return {
    usePopup: () => {
      return {
        open: mockOpen,
        close: jest.fn(),
      };
    },
  };
});

// Mock UserMenuPopup to avoid its dependencies
jest.mock('@/features/user/ui/user-menu-popup', () => {
  return {
    UserMenuPopup: () => {
      return <div data-testid='user-menu-popup' />;
    },
  };
});

const makeUser = (overrides: Partial<UserProps> = {}): UserProps => {
  return {
    id: 1,
    name: 'Alice Smith',
    email: 'alice@example.com',
    email_verified_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
};

const user = userEvent.setup({ delay: null });

describe('UserInfo', () => {
  beforeEach(() => {
    mockOpen.mockClear();
  });
  it('renders user name', () => {
    render(<UserInfo user={makeUser()} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('renders user email', () => {
    render(<UserInfo user={makeUser()} />);
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('renders open user menu button', () => {
    render(<UserInfo user={makeUser()} />);
    expect(
      screen.getByRole('button', { name: /open user menu/i }),
    ).toBeInTheDocument();
  });

  it('renders the first letter of name in avatar', () => {
    render(<UserInfo user={makeUser({ name: 'Bob' })} />);
    expect(screen.getByRole('img')).toHaveTextContent('B');
  });

  it('calls open() when avatar button is clicked', async () => {
    render(<UserInfo user={makeUser()} />);
    await user.click(screen.getByRole('button', { name: /open user menu/i }));
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it('passes width and preferredPosition to open()', async () => {
    render(<UserInfo user={makeUser()} />);
    await user.click(screen.getByRole('button', { name: /open user menu/i }));
    const [, options] = mockOpen.mock.calls[0] as [
      unknown,
      { width: number; preferredPosition: string },
    ];

    expect(options.width).toBe(200);
    expect(options.preferredPosition).toBe('bottom');
  });
});
