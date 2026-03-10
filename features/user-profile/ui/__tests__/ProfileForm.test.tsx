/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfileForm } from '@/features/user-profile/ui/ProfileForm';

import type { UserProps } from '@/entities/user';

jest.mock('@/features/user-profile/api/profile', () => {
  return {
    updateProfile: jest.fn(() => {
      return Promise.resolve({ error: null });
    }),
  };
});

jest.mock('sonner', () => {
  return {
    toast: { error: jest.fn(), success: jest.fn() },
  };
});

const makeUser = (overrides?: Partial<UserProps>): UserProps => {
  return {
    id: 1,
    name: 'Jane Doe',
    email: 'jane@example.com',
    email_verified_at: new Date('2024-01-01'),
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    ...overrides,
  };
};

describe('ProfileForm', () => {
  it('renders name input with user value', () => {
    render(<ProfileForm user={makeUser()} />);
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
  });

  it('does not render an email input', () => {
    render(<ProfileForm user={makeUser()} />);
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  it('renders the Save button', () => {
    render(<ProfileForm user={makeUser()} />);
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument();
  });

  it('disables Save button when form is not dirty', () => {
    render(<ProfileForm user={makeUser()} />);
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeDisabled();
  });

  it('enables Save button after editing name', async () => {
    render(<ProfileForm user={makeUser()} />);
    const nameInput = screen.getByDisplayValue('Jane Doe');

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Jane Smith');
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).not.toBeDisabled();
  });

  it('shows required validation error on empty name', async () => {
    render(<ProfileForm user={makeUser()} />);
    const nameInput = screen.getByDisplayValue('Jane Doe');

    await userEvent.clear(nameInput);
    await userEvent.click(
      screen.getByRole('button', { name: /save changes/i }),
    );
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });
});
