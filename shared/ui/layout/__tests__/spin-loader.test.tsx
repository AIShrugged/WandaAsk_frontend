import { render } from '@testing-library/react';

import SpinLoader from '@/shared/ui/layout/spin-loader';

describe('SpinLoader', () => {
  it('renders a spinning element', () => {
    const { container } = render(<SpinLoader />);
    const el = container.firstChild as HTMLElement;

    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('animate-spin');
  });

  it('has rounded-full shape', () => {
    const { container } = render(<SpinLoader />);

    expect(container.firstChild).toHaveClass('rounded-full');
  });
});
