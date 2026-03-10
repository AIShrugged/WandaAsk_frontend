import { render, screen } from '@testing-library/react';

import { ConclusionItem } from '@/features/analysis/ui/conclusion-item';

describe('ConclusionItem', () => {
  it('renders the title', () => {
    render(<ConclusionItem title='Strengths' items={[]} />);
    expect(screen.getByText('Strengths')).toBeInTheDocument();
  });

  it('renders each item as a list entry', () => {
    render(
      <ConclusionItem
        title='Notes'
        items={['First point', 'Second point', 'Third point']}
      />,
    );
    expect(screen.getByText('First point')).toBeInTheDocument();
    expect(screen.getByText('Second point')).toBeInTheDocument();
    expect(screen.getByText('Third point')).toBeInTheDocument();
  });

  it('renders bullet markers for each item', () => {
    const { container } = render(
      <ConclusionItem title='List' items={['A', 'B']} />,
    );

    const bullets = container.querySelectorAll('span');

    expect(bullets.length).toBeGreaterThanOrEqual(2);
  });

  it('renders empty list when items array is empty', () => {
    const { container } = render(<ConclusionItem title='Empty' items={[]} />);

    const listItems = container.querySelectorAll('li');

    expect(listItems).toHaveLength(0);
  });

  it('renders a single item correctly', () => {
    render(<ConclusionItem title='Solo' items={['Only item']} />);
    expect(screen.getByText('Only item')).toBeInTheDocument();
  });

  it('wraps items in an unordered list', () => {
    const { container } = render(
      <ConclusionItem title='List' items={['Item']} />,
    );

    expect(container.querySelector('ul')).toBeInTheDocument();
  });
});
