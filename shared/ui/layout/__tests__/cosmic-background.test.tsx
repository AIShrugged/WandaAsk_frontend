import { render } from '@testing-library/react';
import React from 'react';

import { CosmicBackground } from '@/shared/ui/layout/cosmic-background';

describe('CosmicBackground', () => {
  it('renders without errors', () => {
    const { container } = render(<CosmicBackground />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('is aria-hidden (decorative element)', () => {
    const { container } = render(<CosmicBackground />);
    const root = container.firstChild as HTMLElement;

    expect(root).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders star particle divs', () => {
    const { container } = render(<CosmicBackground />);
    // There are 20 stars + 4 orb divs + 1 root = multiple child divs
    const divs = container.querySelectorAll('div > div');

    expect(divs.length).toBeGreaterThan(0);
  });
});
