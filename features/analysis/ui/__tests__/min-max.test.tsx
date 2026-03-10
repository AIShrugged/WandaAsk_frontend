import { render, screen } from '@testing-library/react';

import MinMax from '@/features/analysis/ui/min-max';

describe('MinMax', () => {
  it('renders current and max values', () => {
    render(<MinMax current_value={7} max_value={10} />);
    expect(screen.getByText('7 out of 10')).toBeInTheDocument();
  });

  it('renders zero current value', () => {
    render(<MinMax current_value={0} max_value={5} />);
    expect(screen.getByText('0 out of 5')).toBeInTheDocument();
  });

  it('renders when current equals max', () => {
    render(<MinMax current_value={10} max_value={10} />);
    expect(screen.getByText('10 out of 10')).toBeInTheDocument();
  });
});
