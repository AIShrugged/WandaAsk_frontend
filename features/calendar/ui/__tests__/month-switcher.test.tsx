/* eslint-disable jsdoc/require-jsdoc */
import { render, screen, fireEvent } from '@testing-library/react';

import { MonthSwitcher } from '@/features/calendar/ui/month-switcher';

const mockPush = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: mockPush };
    },
    useSearchParams: () => {
      return new URLSearchParams();
    },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MonthSwitcher', () => {
  it('renders the current month name', () => {
    render(<MonthSwitcher currentMonth='2024-03-01' />);
    expect(screen.getByText('March, 2024')).toBeInTheDocument();
  });

  it('renders prev and next navigation buttons', () => {
    render(<MonthSwitcher currentMonth='2024-03-01' />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('navigates to previous month on prev click', () => {
    render(<MonthSwitcher currentMonth='2024-03-01' />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('2024-02-01'),
    );
  });

  it('navigates to next month on next click', () => {
    render(<MonthSwitcher currentMonth='2024-03-01' />);
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('2024-04-01'),
    );
  });
});
