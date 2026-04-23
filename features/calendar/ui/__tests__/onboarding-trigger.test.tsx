import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

jest.mock('@/features/calendar/api/calendar', () => {
  return {
    attachCalendar: jest.fn(),
  };
});

jest.mock('@/features/calendar/ui/onboarding-image', () => {
  return {
    __esModule: true,

    default: () => {
      return <img alt='Google Icon' />;
    },
  };
});

jest.mock('@/shared/ui/typography/H1', () => {
  return {
    H1: ({ children }: React.PropsWithChildren) => {
      return <h1>{children}</h1>;
    },
  };
});

import { attachCalendar } from '@/features/calendar/api/calendar';
import OnboardingTrigger from '@/features/calendar/ui/onboarding-trigger';

const mockAttachCalendar = attachCalendar as jest.Mock;
const user = userEvent.setup({ delay: null });

describe('OnboardingTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom's window.location can be deleted and replaced
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).location = { href: '' };
  });

  it('renders "Continue with Google" heading', () => {
    render(<OnboardingTrigger />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('renders the Google icon button', () => {
    render(<OnboardingTrigger />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByAltText('Google Icon')).toBeInTheDocument();
  });

  it('does not show pending message initially', () => {
    render(<OnboardingTrigger />);
    expect(screen.queryByText(/redirecting/i)).not.toBeInTheDocument();
  });

  it('shows "Redirecting to Google..." while pending', async () => {
    mockAttachCalendar.mockReturnValue(new Promise(() => {}));
    render(<OnboardingTrigger />);
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByText(/redirecting to google/i)).toBeInTheDocument();
  });

  it('disables the button while pending', async () => {
    mockAttachCalendar.mockReturnValue(new Promise(() => {}));
    render(<OnboardingTrigger />);
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls attachCalendar and does not show an error on success', async () => {
    mockAttachCalendar.mockResolvedValue('https://accounts.google.com/oauth');
    render(<OnboardingTrigger />);
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(mockAttachCalendar).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('shows error message when attachCalendar throws', async () => {
    mockAttachCalendar.mockRejectedValue(new Error('OAuth failed'));
    render(<OnboardingTrigger />);
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByText('OAuth failed')).toBeInTheDocument();
  });

  it('shows fallback error for non-Error throws', async () => {
    mockAttachCalendar.mockRejectedValue('unknown');
    render(<OnboardingTrigger />);
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('re-enables the button after an error', async () => {
    mockAttachCalendar.mockRejectedValue(new Error('fail'));
    render(<OnboardingTrigger />);
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});
