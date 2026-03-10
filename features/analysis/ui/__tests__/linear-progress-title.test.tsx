import { render, screen } from '@testing-library/react';

import LinearProgressTitle from '@/features/analysis/ui/linear-progress-title';

describe('LinearProgressTitle', () => {
  it('renders the title text', () => {
    render(<LinearProgressTitle title='Engagement' />);
    expect(screen.getByText('Engagement')).toBeInTheDocument();
  });

  it('renders nothing when title is empty string', () => {
    const { container } = render(<LinearProgressTitle title='' />);

    expect(container.firstChild).toBeNull();
  });

  it('applies bold and correct font-size class', () => {
    const { container } = render(<LinearProgressTitle title='Test' />);

    const p = container.querySelector('p');

    expect(p).toHaveClass('font-bold');
  });
});
