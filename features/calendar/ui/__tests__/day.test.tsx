import { render, screen } from '@testing-library/react';

import Day from '@/features/calendar/ui/day';

describe('Day', () => {
  it('renders the day number', () => {
    render(<Day currentDay={new Date(2024, 2, 15)} />); // March 15
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('applies primary background for today', () => {
    render(<Day currentDay={new Date()} />);
    const el = screen.getByText(new Date().getDate().toString());

    expect(el).toHaveClass('bg-primary');
  });

  it('does not apply primary background for non-today', () => {
    render(<Day currentDay={new Date(2000, 0, 1)} />);
    const el = screen.getByText('1');

    expect(el).not.toHaveClass('bg-primary');
  });
});
