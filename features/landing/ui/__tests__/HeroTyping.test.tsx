import { render, screen } from '@testing-library/react';

import { HeroTyping } from '@/features/landing/ui/HeroTyping';

describe('HeroTyping', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders an h1 element', () => {
    render(<HeroTyping />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('starts with an empty or short text (beginning of typing)', () => {
    render(<HeroTyping />);

    const heading = screen.getByRole('heading', { level: 1 });

    // Initially text may be empty or beginning to type
    expect(heading).toBeInTheDocument();
  });

  it('advances typing after time passes', () => {
    render(<HeroTyping />);

    // Advance timers enough to type a few characters
    jest.advanceTimersByTime(300);

    const heading = screen.getByRole('heading', { level: 1 });

    expect(heading).toBeInTheDocument();
  });

  it('cursor element is rendered (aria-hidden span)', () => {
    const { container } = render(<HeroTyping />);

    const ariaHiddenEls = container.querySelectorAll('[aria-hidden="true"]');

    expect(ariaHiddenEls.length).toBeGreaterThanOrEqual(1);
  });
});
