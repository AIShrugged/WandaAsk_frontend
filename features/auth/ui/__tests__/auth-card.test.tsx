import { render, screen } from '@testing-library/react';

import { AuthCard } from '@/features/auth/ui/auth-card';

jest.mock('@/shared/ui/brand', () => {
  return {
    TribesLogo: () => {
      return <div data-testid='tribes-logo' />;
    },
  };
});

jest.mock('@/shared/ui/card', () => {
  return {
    Card: ({ children }: React.PropsWithChildren) => {
      return <div>{children}</div>;
    },
  };
});

describe('AuthCard', () => {
  it('renders the title and subtitle', () => {
    render(
      <AuthCard title='Sign in' subtitle='Welcome back'>
        <p>form</p>
      </AuthCard>,
    );
    expect(
      screen.getByRole('heading', { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <AuthCard title='Test' subtitle='Sub'>
        <button>Submit</button>
      </AuthCard>,
    );
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('renders the logo', () => {
    render(
      <AuthCard title='Test' subtitle='Sub'>
        <span />
      </AuthCard>,
    );
    expect(screen.getByTestId('tribes-logo')).toBeInTheDocument();
  });
});
