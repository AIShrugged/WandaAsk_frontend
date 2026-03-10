/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import UserInfo from '@/features/user/ui/user-info';

import type { UserProps } from '@/entities/user';

// Mock popup context — UserInfo calls open() on click
jest.mock('@/shared/hooks/use-popup', () => {
  return {
    usePopup: () => {
      return {
        open: jest.fn(),
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
    email_verified_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
};

describe('UserInfo', () => {
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
});
