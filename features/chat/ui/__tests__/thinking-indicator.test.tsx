import { render, screen } from '@testing-library/react';

import { ThinkingIndicator } from '@/features/chat/ui/thinking-indicator';

describe('ThinkingIndicator', () => {
  it('renders without errors', () => {
    render(<ThinkingIndicator />);
  });

  it('displays animated dots', () => {
    const { container } = render(<ThinkingIndicator />);
    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('displays an initial thinking phrase', () => {
    render(<ThinkingIndicator />);
    // The component starts with PHRASES[0] = 'Thinking'
    expect(screen.getByText('Thinking')).toBeInTheDocument();
  });
});
