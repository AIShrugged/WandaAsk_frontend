import { render, screen } from '@testing-library/react';

import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';

describe('InfiniteScrollStatus', () => {
  it('displays the item count', () => {
    render(<InfiniteScrollStatus itemCount={42} />);
    expect(screen.getByText('Loaded: 42 items')).toBeInTheDocument();
  });

  it('displays zero count', () => {
    render(<InfiniteScrollStatus itemCount={0} />);
    expect(screen.getByText('Loaded: 0 items')).toBeInTheDocument();
  });

  it('updates when count changes', () => {
    const { rerender } = render(<InfiniteScrollStatus itemCount={5} />);

    expect(screen.getByText('Loaded: 5 items')).toBeInTheDocument();
    rerender(<InfiniteScrollStatus itemCount={10} />);
    expect(screen.getByText('Loaded: 10 items')).toBeInTheDocument();
  });
});
