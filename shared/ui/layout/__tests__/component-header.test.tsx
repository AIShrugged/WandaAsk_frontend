import { render, screen } from '@testing-library/react';

import ComponentHeader from '@/shared/ui/layout/component-header';

describe('ComponentHeader', () => {
  it('renders children', () => {
    render(
      <ComponentHeader>
        <span>Title</span>
      </ComponentHeader>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('applies border-b class', () => {
    const { container } = render(<ComponentHeader>Header</ComponentHeader>);

    expect(container.firstChild).toHaveClass('border-b');
  });

  it('renders multiple children', () => {
    render(
      <ComponentHeader>
        <span>Left</span>
        <span>Right</span>
      </ComponentHeader>,
    );
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
  });
});
