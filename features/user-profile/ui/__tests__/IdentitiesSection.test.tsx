/* eslint-disable jsdoc/require-jsdoc */
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { toast } from 'sonner';

import {
  linkIdentity,
  unlinkIdentity,
} from '@/features/user-profile/api/identities';
import { IdentitiesSection } from '@/features/user-profile/ui/IdentitiesSection';

import type { Identity } from '@/features/user-profile/types';

jest.mock('@/features/user-profile/api/identities', () => {
  return {
    linkIdentity: jest.fn(),
    unlinkIdentity: jest.fn(),
  };
});

jest.mock('sonner', () => {
  return { toast: { error: jest.fn(), success: jest.fn() } };
});

jest.mock('@/shared/ui/button/Button', () => {
  return {
    Button: ({
      children,
      onClick,
      disabled,
      type,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      type?: 'button' | 'submit';
      loading?: boolean;
    }) => {
      return (
        <button type={type ?? 'button'} onClick={onClick} disabled={disabled}>
          {children}
        </button>
      );
    },
  };
});

const mockLinkIdentity = linkIdentity as jest.Mock;

const mockUnlinkIdentity = unlinkIdentity as jest.Mock;

const mockToastError = toast.error as jest.Mock;

const mockToastSuccess = toast.success as jest.Mock;

function makeIdentity(overrides: Partial<Identity> = {}): Identity {
  return {
    id: 1,
    channel: 'telegram',
    channel_identifier: '@alice',
    user_id: 10,
    ...overrides,
  };
}

const user = userEvent.setup({ delay: null });

describe('IdentitiesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('empty state', () => {
    it('renders empty state message when no identities', () => {
      render(<IdentitiesSection initialIdentities={[]} />);
      expect(
        screen.getByText(/no external accounts linked yet/i),
      ).toBeInTheDocument();
    });
  });

  describe('with identities', () => {
    it('renders identity channel and identifier', () => {
      render(<IdentitiesSection initialIdentities={[makeIdentity()]} />);
      // "@alice" is unique — confirms the identity row is rendered
      expect(screen.getByText('@alice')).toBeInTheDocument();
      // "Telegram" appears as both a list item and select option; at least one occurrence exists
      expect(screen.getAllByText('Telegram').length).toBeGreaterThan(0);
    });

    it('formats underscore channels correctly', () => {
      render(
        <IdentitiesSection
          initialIdentities={[makeIdentity({ channel: 'google_calendar' })]}
        />,
      );
      expect(screen.getByText('Google calendar')).toBeInTheDocument();
    });

    it('renders Unlink button for each identity', () => {
      render(
        <IdentitiesSection
          initialIdentities={[
            makeIdentity(),
            makeIdentity({ id: 2, channel_identifier: '@bob' }),
          ]}
        />,
      );
      expect(screen.getAllByRole('button', { name: /unlink/i })).toHaveLength(
        2,
      );
    });
  });

  describe('unlinking', () => {
    it('calls unlinkIdentity with the correct id on click', async () => {
      mockUnlinkIdentity.mockResolvedValue({ data: undefined, error: null });
      render(
        <IdentitiesSection initialIdentities={[makeIdentity({ id: 5 })]} />,
      );
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /unlink/i }));
      });
      expect(mockUnlinkIdentity).toHaveBeenCalledWith(5);
    });

    it('shows success toast after successful unlink', async () => {
      mockUnlinkIdentity.mockResolvedValue({ data: undefined, error: null });
      render(<IdentitiesSection initialIdentities={[makeIdentity()]} />);
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /unlink/i }));
      });
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Identity unlinked.');
      });
    });

    it('shows error toast when unlink fails', async () => {
      mockUnlinkIdentity.mockResolvedValue({
        data: null,
        error: 'Failed to unlink identity. Please try again.',
      });
      render(<IdentitiesSection initialIdentities={[makeIdentity()]} />);
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /unlink/i }));
      });
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          'Failed to unlink identity. Please try again.',
        );
      });
    });
  });

  describe('link form', () => {
    it('renders the link form heading', () => {
      render(<IdentitiesSection initialIdentities={[]} />);
      expect(screen.getByText(/link a new account/i)).toBeInTheDocument();
    });

    it('renders channel select with default "telegram" option', () => {
      render(<IdentitiesSection initialIdentities={[]} />);
      const select = screen.getByRole('combobox', { name: /channel/i });

      expect(select).toHaveValue('telegram');
    });

    it('shows validation error when identifier is empty on submit', async () => {
      render(<IdentitiesSection initialIdentities={[]} />);
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /link account/i }));
      });
      expect(
        await screen.findByText(/identifier is required/i),
      ).toBeInTheDocument();
    });

    it('calls linkIdentity with form data on valid submit', async () => {
      mockLinkIdentity.mockResolvedValue({
        data: makeIdentity({
          id: 99,
          channel: 'zoom',
          channel_identifier: 'zoom@example.com',
        }),
        error: null,
      });
      render(<IdentitiesSection initialIdentities={[]} />);
      await user.selectOptions(
        screen.getByRole('combobox', { name: /channel/i }),
        'zoom',
      );
      await user.type(screen.getByLabelText(/identifier/i), 'zoom@example.com');
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /link account/i }));
      });
      expect(mockLinkIdentity).toHaveBeenCalledWith({
        channel: 'zoom',
        identifier: 'zoom@example.com',
      });
    });

    it('shows success toast after successful link', async () => {
      mockLinkIdentity.mockResolvedValue({
        data: makeIdentity({ id: 99 }),
        error: null,
      });
      render(<IdentitiesSection initialIdentities={[]} />);
      await user.type(screen.getByLabelText(/identifier/i), '@newuser');
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /link account/i }));
      });
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          'Identity linked successfully.',
        );
      });
    });

    it('shows field error for IDENTITY_CONFLICT errorCode', async () => {
      mockLinkIdentity.mockResolvedValue({
        data: null,
        error: 'This identity is already linked to another user.',
        errorCode: 'IDENTITY_CONFLICT',
      });
      render(<IdentitiesSection initialIdentities={[]} />);
      await user.type(screen.getByLabelText(/identifier/i), '@taken');
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /link account/i }));
      });
      expect(
        await screen.findByText(/already linked to another user/i),
      ).toBeInTheDocument();
    });

    it('shows toast error for generic link errors', async () => {
      mockLinkIdentity.mockResolvedValue({
        data: null,
        error: 'Failed to link identity. Please try again.',
      });
      render(<IdentitiesSection initialIdentities={[]} />);
      await user.type(screen.getByLabelText(/identifier/i), '@bad');
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /link account/i }));
      });
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          'Failed to link identity. Please try again.',
        );
      });
    });

    it('resets the identifier field after successful link', async () => {
      mockLinkIdentity.mockResolvedValue({
        data: makeIdentity({ id: 99 }),
        error: null,
      });
      render(<IdentitiesSection initialIdentities={[]} />);
      const identifierInput = screen.getByLabelText(/identifier/i);

      await user.type(identifierInput, '@newuser');
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /link account/i }));
      });
      await waitFor(() => {
        expect(identifierInput).toHaveValue('');
      });
    });
  });
});
