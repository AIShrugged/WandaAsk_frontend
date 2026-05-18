import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

jest.mock('@/features/calendar/api/calendar', () => {
  return {
    attachCalendar: jest.fn(),
  };
});

import { attachCalendar } from '@/features/calendar/api/calendar';
import OnboardingTrigger from '@/features/calendar/ui/onboarding-trigger';

const mockAttachCalendar = attachCalendar as jest.Mock;
const user = userEvent.setup({ delay: null });

describe('OnboardingTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).location = { href: '' };
  });

  it('renders "No calendar connected." text', () => {
    render(<OnboardingTrigger organizationId={42} />);
    expect(screen.getByText('No calendar connected.')).toBeInTheDocument();
  });

  it('renders "Connect Google Calendar" button', () => {
    render(<OnboardingTrigger organizationId={42} />);
    expect(
      screen.getByRole('button', { name: 'Connect Google Calendar' }),
    ).toBeInTheDocument();
  });

  it('does not show pending message initially', () => {
    render(<OnboardingTrigger organizationId={42} />);
    expect(screen.queryByText(/redirecting/i)).not.toBeInTheDocument();
  });

  it('shows "Redirecting to Google..." while pending', async () => {
    mockAttachCalendar.mockReturnValue(new Promise(() => {}));
    render(<OnboardingTrigger organizationId={42} />);
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByText(/redirecting to google/i)).toBeInTheDocument();
  });

  it('disables the button while pending', async () => {
    mockAttachCalendar.mockReturnValue(new Promise(() => {}));
    render(<OnboardingTrigger organizationId={42} />);
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls attachCalendar with organizationId on click', async () => {
    mockAttachCalendar.mockResolvedValue('https://accounts.google.com/oauth');
    render(<OnboardingTrigger organizationId={42} />);
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(mockAttachCalendar).toHaveBeenCalledWith(42);
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('shows error message when attachCalendar throws', async () => {
    mockAttachCalendar.mockRejectedValue(new Error('OAuth failed'));
    render(<OnboardingTrigger organizationId={42} />);
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByText('OAuth failed')).toBeInTheDocument();
  });

  it('re-enables the button after an error', async () => {
    mockAttachCalendar.mockRejectedValue(new Error('fail'));
    render(<OnboardingTrigger organizationId={42} />);
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});
