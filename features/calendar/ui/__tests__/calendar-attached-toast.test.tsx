import { act, render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';

import CalendarAttachedToast from '@/features/calendar/ui/calendar-attached-toast';

jest.mock('sonner', () => {
  return { toast: { success: jest.fn() } };
});

jest.mock('next/navigation', () => {
  return {
    useRouter: jest.fn(() => {
      return { replace: jest.fn() };
    }),
  };
});

const mockToastSuccess = toast.success as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

describe('CalendarAttachedToast', () => {
  let mockReplace: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReplace = jest.fn();
    mockUseRouter.mockReturnValue({ replace: mockReplace });
  });

  it('renders null (no DOM output)', () => {
    const { container } = render(<CalendarAttachedToast />);

    expect(container).toBeEmptyDOMElement();
  });

  it('fires success toast on mount', () => {
    act(() => {
      render(<CalendarAttachedToast />);
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      'Google Calendar connected successfully!',
    );
    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
  });

  it('calls router.replace once to strip the ?attached param', () => {
    act(() => {
      render(<CalendarAttachedToast />);
    });
    expect(mockReplace).toHaveBeenCalledTimes(1);
    // The URL passed to replace should NOT contain ?attached
    const replacedUrl = mockReplace.mock.calls[0][0] as string;

    expect(replacedUrl).not.toContain('attached');
  });

  it('does not re-fire toast on re-render', () => {
    const { rerender } = render(<CalendarAttachedToast />);

    rerender(<CalendarAttachedToast />);
    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
  });
});
