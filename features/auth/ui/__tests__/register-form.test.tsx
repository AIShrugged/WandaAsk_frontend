import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RegisterForm from '@/features/auth/ui/register-form';

const mockRegister = jest.fn();

jest.mock('@/features/auth/api/auth', () => {
  return {
    register: (...args: unknown[]) => {
      return mockRegister(...args);
    },
  };
});

jest.mock('sonner', () => {
  return {
    toast: { error: jest.fn(), success: jest.fn() },
  };
});

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

const mockPush = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: mockPush };
    },
    useSearchParams: () => {
      return {
        get: jest.fn().mockReturnValue(null),
      };
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

describe('RegisterForm', () => {
  beforeEach(() => {
    mockRegister.mockResolvedValue({});
  });

  it('renders name, email, password fields and terms checkbox', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders Get Started submit button', () => {
    render(<RegisterForm />);
    expect(
      screen.getByRole('button', { name: /get started/i }),
    ).toBeInTheDocument();
  });

  it('submit button is disabled when form is pristine', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('button', { name: /get started/i })).toBeDisabled();
  });

  it('renders Log In link', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  });

  it('enables submit button after filling all required fields', async () => {
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText(/name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('checkbox'));
    expect(
      screen.getByRole('button', { name: /get started/i }),
    ).not.toBeDisabled();
  });

  it('shows name validation error for short name after blur', async () => {
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText(/name/i), 'A');
    await userEvent.tab();
    expect(await screen.findByText(/minimum name length/i)).toBeInTheDocument();
  });

  it('shows email validation error for invalid email after blur', async () => {
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText(/email/i), 'bad');
    await userEvent.tab();
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });
});
