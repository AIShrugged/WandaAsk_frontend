import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChangePasswordForm } from '@/features/user-profile/ui/ChangePasswordForm';

const mockChangePassword = jest.fn(() => {
  return Promise.resolve({ error: null });
});

jest.mock('@/features/user-profile/api/profile', () => {
  return {
    /**
     *
     * @param {...any} args
     */
    changePassword: (...args: unknown[]) => {
      return mockChangePassword(...args);
    },
  };
});

jest.mock('sonner', () => {
  return {
    toast: { error: jest.fn(), success: jest.fn() },
  };
});

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    mockChangePassword.mockResolvedValue({ error: null });
  });

  it('renders all three password fields', () => {
    render(<ChangePasswordForm />);
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it('renders the Change password button', () => {
    render(<ChangePasswordForm />);
    expect(
      screen.getByRole('button', { name: /change password/i }),
    ).toBeInTheDocument();
  });

  it('disables button when form is pristine', () => {
    render(<ChangePasswordForm />);
    expect(
      screen.getByRole('button', { name: /change password/i }),
    ).toBeDisabled();
  });

  it('shows required error for empty current password on submit', async () => {
    render(<ChangePasswordForm />);
    const currentInput = screen.getByLabelText(/current password/i);
    const newInput = screen.getByLabelText('New password');

    await userEvent.type(currentInput, 'old');
    await userEvent.clear(currentInput);
    await userEvent.type(newInput, 'newpassword1');
    await userEvent.click(
      screen.getByRole('button', { name: /change password/i }),
    );
    expect(
      await screen.findByText(/current password is required/i),
    ).toBeInTheDocument();
  });

  it('shows minLength error when new password is too short', async () => {
    render(<ChangePasswordForm />);
    const newInput = screen.getByLabelText('New password');

    await userEvent.type(newInput, '123');
    await userEvent.click(
      screen.getByRole('button', { name: /change password/i }),
    );
    expect(
      await screen.findByText(/at least 8 characters/i),
    ).toBeInTheDocument();
  });

  it('shows mismatch error when passwords do not match', async () => {
    render(<ChangePasswordForm />);
    await userEvent.type(
      screen.getByLabelText(/current password/i),
      'current1',
    );
    await userEvent.type(
      screen.getByLabelText(/^new password/i),
      'newpassword1',
    );
    await userEvent.type(
      screen.getByLabelText(/confirm new password/i),
      'different1234',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /change password/i }),
    );
    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
  });

  it('shows field-level error on current_password when INVALID_CURRENT_PASSWORD is returned', async () => {
    mockChangePassword.mockResolvedValue({
      data: null,
      error: 'Current password is incorrect',
      errorCode: 'INVALID_CURRENT_PASSWORD',
    });

    render(<ChangePasswordForm />);
    await userEvent.type(
      screen.getByLabelText(/current password/i),
      'wrongpass',
    );
    await userEvent.type(
      screen.getByLabelText(/^new password/i),
      'newpassword1',
    );
    await userEvent.type(
      screen.getByLabelText(/confirm new password/i),
      'newpassword1',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /change password/i }),
    );
    expect(
      await screen.findByText(/current password is incorrect/i),
    ).toBeInTheDocument();
  });
});
