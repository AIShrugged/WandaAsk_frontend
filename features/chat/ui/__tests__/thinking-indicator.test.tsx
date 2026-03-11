import { act, render, screen } from '@testing-library/react';

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

  it('fades out phrase after wait phase', () => {
    jest.useFakeTimers();
    // Math.random() = 0 → wait = exactly 1500ms
    jest.spyOn(Math, 'random').mockReturnValue(0);
    render(<ThinkingIndicator />);
    const phraseEl = screen.getByText('Thinking');

    expect(phraseEl).toHaveClass('opacity-100');
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(phraseEl).toHaveClass('opacity-0');
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('shows a new phrase after full wait + fadeOut cycle', () => {
    jest.useFakeTimers();
    // Math.random() = 0 → wait = 1500ms, fadeOut = 300ms → total 1800ms
    jest.spyOn(Math, 'random').mockReturnValue(0);
    render(<ThinkingIndicator />);
    act(() => {
      jest.advanceTimersByTime(1800);
    });
    // After 'show' phase the visible class is back
    const phraseEl = document.querySelector('span.text-xs') as HTMLElement;

    expect(phraseEl).toHaveClass('opacity-100');
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('cleans up timers on unmount', () => {
    jest.useFakeTimers();
    const clearSpy = jest.spyOn(globalThis, 'clearTimeout');

    const { unmount } = render(<ThinkingIndicator />);

    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    jest.useRealTimers();
  });
});
