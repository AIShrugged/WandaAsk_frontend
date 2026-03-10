import { render, screen } from '@testing-library/react';

import CardBody from '@/shared/ui/card/CardBody';

describe('CardBody', () => {
  it('renders children', () => {
    render(
      <CardBody>
        <span>Content</span>
      </CardBody>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies padding class p-6', () => {
    const { container } = render(<CardBody>Body</CardBody>);

    expect(container.firstChild).toHaveClass('p-6');
  });

  it('renders as a flex column', () => {
    const { container } = render(<CardBody>Body</CardBody>);

    expect(container.firstChild).toHaveClass('flex', 'flex-col');
  });
});
