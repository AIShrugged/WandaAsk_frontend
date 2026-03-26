import { render, screen } from '@testing-library/react';

import User from '@/features/user/ui/user';

jest.mock('@/features/user/api/user', () => {
  return {
    getUser: jest.fn(),
  };
});

jest.mock('@/features/user/ui/user-info', () => {
  return {
    __esModule: true,
    default: ({ user }: { user: { name: string; email: string } }) => {
      return <div data-testid='user-info'>{user.name}</div>;
    },
  };
});

jest.mock('@/features/user/ui/user-error-banner', () => {
  return {
    __esModule: true,
    default: ({ type }: { type: string }) => {
      return <div data-testid='user-error'>{type}</div>;
    },
  };
});

const { getUser } = jest.requireMock('@/features/user/api/user');

describe('User', () => {
  it('renders UserInfo when user is returned', async () => {
    getUser.mockResolvedValueOnce({
      data: { id: 1, name: 'Alice', email: 'alice@example.com' },
    });

    render(await User());

    expect(screen.getByTestId('user-info')).toHaveTextContent('Alice');
  });

  it('renders UserErrorBanner when data is null', async () => {
    getUser.mockResolvedValueOnce({ data: null });

    render(await User());

    expect(screen.getByTestId('user-error')).toHaveTextContent('notFound');
  });

  it('renders UserErrorBanner when data is undefined', async () => {
    getUser.mockResolvedValueOnce({ data: undefined });

    render(await User());

    expect(screen.getByTestId('user-error')).toBeInTheDocument();
  });
});
