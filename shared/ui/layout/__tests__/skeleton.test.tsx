import { render } from '@testing-library/react';

import { Skeleton, SkeletonList } from '@/shared/ui/layout/skeleton';

describe('Skeleton', () => {
  it('renders with animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className='h-4 w-32' />);
    expect(container.firstChild).toHaveClass('h-4', 'w-32');
  });
});

describe('SkeletonList', () => {
  it('renders 5 rows by default', () => {
    const { container } = render(<SkeletonList />);
    // Each row has one round skeleton + two line skeletons = 3 per row × 5 = 15
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(15);
  });

  it('renders the specified number of rows', () => {
    const { container } = render(<SkeletonList rows={3} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(9); // 3 rows × 3 skeletons each
  });
});
