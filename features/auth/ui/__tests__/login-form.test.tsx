/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LoginForm from '@/features/auth/ui/login-form';

const mockLogin = jest.fn();

jest.mock('@/features/auth/api/auth', () => {
  return {
    login: (...args: unknown[]) => {
      return mockLogin(...args);
    },
  };
});

jest.mock('sonner', () => {
  return {
    toast: { error: jest.fn(), success: jest.fn() },
  };
});

const mockPush = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: mockPush };
    },
  };
});

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
    }: {
      children: React.ReactNode;
      href: string;
    }) => {
      return <a href={href}>{children}</a>;
    },
  };
});

jest.mock('motion/react-client', () => {
  return {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => {
      return <div {...props}>{children}</div>;
    },
  };
});

describe('LoginForm', () => {
  beforeEach(() => {
    mockLogin.mockResolvedValue({});
  });

  it('renders email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders Log In submit button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('submit button is disabled when form is pristine', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled();
  });

  it('renders Register link', () => {
    render(<LoginForm />);
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });

  it('enables submit button after user types in fields', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    expect(screen.getByRole('button', { name: /log in/i })).not.toBeDisabled();
  });

  it('shows email validation error for invalid email after blur', async () => {
    render(<LoginForm />);
    const emailInput = screen.getByLabelText(/email/i);

    await userEvent.type(emailInput, 'bad-email');
    await userEvent.tab(); // trigger blur
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('calls login API with email and password on submit', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        password: 'secret' + '123',
      }),
    );
  });
});
