import { act, render, screen } from '@testing-library/react';

import { HeroTyping } from '@/features/landing/ui/HeroTyping';

const PHRASE_0 = 'Stop Losing Ideas After Every Meeting';
const TYPED_SPAN = 'span:first-child';

// PHRASES[0] = 'Stop Losing Ideas After Every Meeting' (37 chars)
// TYPE_MS = 52ms per char, DELETE_MS = 28ms per char
// PAUSE_TYPED_MS = 2300ms, PAUSE_DELETED_MS = 420ms

// Each state update schedules a new setTimeout, so we must wrap each tick in act().
/**
 *
 * @param n
 */
function tickType(n = 1) {
  for (let i = 0; i < n; i++) {
    act(() => {
      jest.advanceTimersByTime(52);
    });
  }
}

/**
 *
 * @param n
 */
function tickDelete(n = 1) {
  for (let i = 0; i < n; i++) {
    act(() => {
      jest.advanceTimersByTime(28);
    });
  }
}

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

  it('cursor element is rendered (aria-hidden span)', () => {
    const { container } = render(<HeroTyping />);
    const ariaHiddenEls = container.querySelectorAll('[aria-hidden="true"]');

    expect(ariaHiddenEls.length).toBeGreaterThanOrEqual(1);
  });

  it('types a character after the first TYPE_MS tick', () => {
    render(<HeroTyping />);
    tickType(1);
    const heading = screen.getByRole('heading', { level: 1 });
    const span = heading.querySelector(TYPED_SPAN) as HTMLElement;

    expect(span.textContent).toBe('S');
  });

  it('types the full first phrase character by character', () => {
    render(<HeroTyping />);
    const phrase = PHRASE_0;

    tickType(phrase.length);
    const heading = screen.getByRole('heading', { level: 1 });
    const span = heading.querySelector(TYPED_SPAN) as HTMLElement;

    expect(span.textContent).toBe(phrase);
  });

  it('starts deleting after PAUSE_TYPED_MS', () => {
    render(<HeroTyping />);
    const phrase = PHRASE_0;

    tickType(phrase.length);
    // Pause before delete
    act(() => {
      jest.advanceTimersByTime(2300 + 50);
    });
    // Delete a few chars
    tickDelete(5);
    const heading = screen.getByRole('heading', { level: 1 });
    const span = heading.querySelector(TYPED_SPAN) as HTMLElement;

    expect(span.textContent?.length ?? 0).toBeLessThan(phrase.length);
  });

  it('moves to the next phrase after full delete + pause-deleted', () => {
    render(<HeroTyping />);
    const phrase = PHRASE_0;

    tickType(phrase.length);
    // Pause typed
    act(() => {
      jest.advanceTimersByTime(2300 + 50);
    });
    // Delete all chars
    tickDelete(phrase.length);
    // Pause deleted
    act(() => {
      jest.advanceTimersByTime(420 + 50);
    });
    // Type a couple of chars of phrase[1]
    tickType(3);
    const heading = screen.getByRole('heading', { level: 1 });
    const span = heading.querySelector(TYPED_SPAN) as HTMLElement;

    expect(
      'Turn Meetings into Instant Actions'.startsWith(span.textContent ?? '_'),
    ).toBe(true);
  });

  it('cleans up timers on unmount', () => {
    const clearSpy = jest.spyOn(globalThis, 'clearTimeout');
    const { unmount } = render(<HeroTyping />);

    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
