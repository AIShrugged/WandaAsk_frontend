import { render, screen } from '@testing-library/react';

import AuthTitle from '@/features/auth/ui/auth-title';

describe('AuthTitle', () => {
  it('renders "Sign In" for auth variant', () => {
    render(<AuthTitle type='auth' />);
    expect(
      screen.getByRole('heading', { name: 'Sign In' }),
    ).toBeInTheDocument();
  });

  it('renders "Register" for register variant', () => {
    render(<AuthTitle type='register' />);
    expect(
      screen.getByRole('heading', { name: 'Register' }),
    ).toBeInTheDocument();
  });

  it('renders "Organization" for organization variant', () => {
    render(<AuthTitle type='organization' />);
    expect(
      screen.getByRole('heading', { name: 'Organization' }),
    ).toBeInTheDocument();
  });
});
