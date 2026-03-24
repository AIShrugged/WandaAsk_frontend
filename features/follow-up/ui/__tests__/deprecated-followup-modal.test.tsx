/* eslint-disable jsdoc/require-jsdoc */
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DeprecatedFollowUpModal from '@/features/follow-up/ui/deprecated-followup-modal';

const mockRefresh = jest.fn();

const mockRegenerateFollowUp = jest.fn();

const mockPollFollowUp = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return {
        refresh: mockRefresh,
      };
    },
  };
});

jest.mock('@/features/follow-up/api/follow-up', () => {
  return {
    regenerateFollowUp: (...args: unknown[]) => {
      return mockRegenerateFollowUp(...args);
    },
    pollFollowUp: (...args: unknown[]) => {
      return mockPollFollowUp(...args);
    },
  };
});

describe('DeprecatedFollowUpModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens automatically with the deprecation notice', () => {
    render(<DeprecatedFollowUpModal followUpId={5} />);

    expect(
      screen.getByText('Created with outdated methodology'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /regenerate with the new methodology/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /keep as is/i }),
    ).toBeInTheDocument();
  });

  it('closes when keep as is is clicked', async () => {
    const user = userEvent.setup({
      delay: null,
      advanceTimers: jest.advanceTimersByTime,
    });

    render(<DeprecatedFollowUpModal followUpId={5} />);

    await user.click(screen.getByRole('button', { name: /keep as is/i }));

    await waitFor(() => {
      expect(
        screen.queryByText('Created with outdated methodology'),
      ).not.toBeInTheDocument();
    });
  });

  it('shows waiting state and refreshes after polling reaches done', async () => {
    const user = userEvent.setup({
      delay: null,
      advanceTimers: jest.advanceTimersByTime,
    });

    mockRegenerateFollowUp.mockResolvedValueOnce({
      data: {
        id: 42,
        methodology_id: 8,
        is_deprecated: false,
        status: 'in_progress',
        text: '',
      },
    });
    mockPollFollowUp.mockResolvedValueOnce({
      data: {
        id: 42,
        methodology_id: 8,
        is_deprecated: false,
        status: 'done',
        text: 'Ready',
      },
    });

    render(<DeprecatedFollowUpModal followUpId={5} />);

    await user.click(
      screen.getByRole('button', {
        name: /regenerate with the new methodology/i,
      }),
    );

    expect(
      screen.getByText('Generating a report with the new methodology...'),
    ).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    expect(mockPollFollowUp).toHaveBeenCalledWith(42);
    expect(mockRefresh).toHaveBeenCalled();
    expect(
      screen.queryByText('Created with outdated methodology'),
    ).not.toBeInTheDocument();
  });

  it('shows an error state and retries regeneration', async () => {
    const user = userEvent.setup({
      delay: null,
      advanceTimers: jest.advanceTimersByTime,
    });

    mockRegenerateFollowUp.mockResolvedValueOnce({
      data: {
        id: 42,
        methodology_id: 8,
        is_deprecated: false,
        status: 'failed',
        text: '',
      },
    });
    mockRegenerateFollowUp.mockResolvedValueOnce({
      data: {
        id: 43,
        methodology_id: 8,
        is_deprecated: false,
        status: 'in_progress',
        text: '',
      },
    });
    mockPollFollowUp.mockResolvedValueOnce({
      data: {
        id: 43,
        methodology_id: 8,
        is_deprecated: false,
        status: 'done',
        text: 'Ready',
      },
    });

    render(<DeprecatedFollowUpModal followUpId={5} />);

    await act(async () => {
      await user.click(
        screen.getByRole('button', {
          name: /regenerate with the new methodology/i,
        }),
      );
      await Promise.resolve();
    });

    expect(screen.getByText('Unable to update the report')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(mockRegenerateFollowUp).toHaveBeenCalledTimes(2);
  });
});
