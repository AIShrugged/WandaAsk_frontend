import { render, screen } from '@testing-library/react';

import DayOfWeek from '@/features/calendar/ui/day-of-week';

describe('DayOfWeek', () => {
  it('renders all 7 days', () => {
    render(<DayOfWeek />);
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it('renders a grid container', () => {
    const { container } = render(<DayOfWeek />);

    expect(container.querySelector('.grid-cols-7')).toBeInTheDocument();
  });
});
