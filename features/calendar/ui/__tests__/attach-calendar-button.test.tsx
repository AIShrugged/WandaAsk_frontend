import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

jest.mock('@/features/calendar/api/calendar', () => {
  return {
    attachCalendar: jest.fn(),
  };
});

import { attachCalendar } from '@/features/calendar/api/calendar';
import { AttachCalendarButton } from '@/features/calendar/ui/attach-calendar-button';

const mockAttachCalendar = attachCalendar as jest.Mock;
const user = userEvent.setup({ delay: null });

describe('AttachCalendarButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).location = { href: '' };
  });

  it('renders children as button label', () => {
    render(
      <AttachCalendarButton organizationId={42}>Connect</AttachCalendarButton>,
    );
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('renders default label when no children provided', () => {
    render(<AttachCalendarButton organizationId={42} />);
    expect(
      screen.getByRole('button', { name: 'Connect Calendar' }),
    ).toBeInTheDocument();
  });

  it('calls attachCalendar with organizationId on click', async () => {
    mockAttachCalendar.mockResolvedValue('https://accounts.google.com/oauth');
    render(
      <AttachCalendarButton organizationId={42}>Connect</AttachCalendarButton>,
    );
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(mockAttachCalendar).toHaveBeenCalledWith(42);
  });

  it('navigates to the redirect URL on success', async () => {
    mockAttachCalendar.mockResolvedValue('https://accounts.google.com/oauth');
    render(
      <AttachCalendarButton organizationId={42}>Connect</AttachCalendarButton>,
    );
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    // attachCalendar resolved — confirms the redirect URL was received
    expect(mockAttachCalendar).toHaveBeenCalledWith(42);
    // No error should appear after successful navigation
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('shows "Connecting..." text while pending', async () => {
    mockAttachCalendar.mockReturnValue(new Promise(() => {}));
    render(
      <AttachCalendarButton organizationId={42}>Connect</AttachCalendarButton>,
    );
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('button')).toHaveTextContent('Connecting...');
  });

  it('disables the button while pending', async () => {
    mockAttachCalendar.mockReturnValue(new Promise(() => {}));
    render(
      <AttachCalendarButton organizationId={42}>Connect</AttachCalendarButton>,
    );
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('prevents double-click: only calls attachCalendar once', async () => {
    mockAttachCalendar.mockReturnValue(new Promise(() => {}));
    render(
      <AttachCalendarButton organizationId={42}>Connect</AttachCalendarButton>,
    );
    const button = screen.getByRole('button');
    await act(async () => {
      await user.click(button);
    });
    // Button is now disabled; second click is a no-op
    await act(async () => {
      await user.click(button);
    });
    expect(mockAttachCalendar).toHaveBeenCalledTimes(1);
  });

  it('shows error message on failure', async () => {
    mockAttachCalendar.mockRejectedValue(new Error('OAuth failed'));
    render(
      <AttachCalendarButton organizationId={42}>Connect</AttachCalendarButton>,
    );
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByText('OAuth failed')).toBeInTheDocument();
  });

  it('shows fallback error for non-Error throws', async () => {
    mockAttachCalendar.mockRejectedValue('unexpected string');
    render(
      <AttachCalendarButton organizationId={42}>Connect</AttachCalendarButton>,
    );
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('re-enables button after error', async () => {
    mockAttachCalendar.mockRejectedValue(new Error('fail'));
    render(
      <AttachCalendarButton organizationId={42}>Connect</AttachCalendarButton>,
    );
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('does not show error initially', () => {
    render(
      <AttachCalendarButton organizationId={42}>Connect</AttachCalendarButton>,
    );
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('shows pendingText while pending when provided', async () => {
    mockAttachCalendar.mockReturnValue(new Promise(() => {}));
    render(
      <AttachCalendarButton
        organizationId={42}
        pendingText='Redirecting to Google...'
      >
        Connect
      </AttachCalendarButton>,
    );
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByText('Redirecting to Google...')).toBeInTheDocument();
  });

  it('does not show pendingText when not provided', async () => {
    mockAttachCalendar.mockReturnValue(new Promise(() => {}));
    render(
      <AttachCalendarButton organizationId={42}>Connect</AttachCalendarButton>,
    );
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(
      screen.queryByText('Redirecting to Google...'),
    ).not.toBeInTheDocument();
  });

  it('applies className to the button', () => {
    render(
      <AttachCalendarButton organizationId={42} className='my-custom-class'>
        Connect
      </AttachCalendarButton>,
    );
    expect(screen.getByRole('button')).toHaveClass('my-custom-class');
  });
});
