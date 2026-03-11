import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { PixelRobot } from '@/features/landing/ui/PixelRobot';

const SESSION_KEY = 'tribes-robot-shown';

describe('PixelRobot', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Math.random() = 0 → delay = exactly 4000ms
    jest.spyOn(Math, 'random').mockReturnValue(0);
    sessionStorage.removeItem(SESSION_KEY);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    sessionStorage.removeItem(SESSION_KEY);
  });

  it('renders nothing initially (before delay fires)', () => {
    const { container } = render(<PixelRobot />);

    expect(container.querySelector('[role="presentation"]')).toBeNull();
  });

  it('becomes visible after 4000ms delay (Math.random=0)', () => {
    render(<PixelRobot />);
    act(() => {
      jest.advanceTimersByTime(4100);
    });
    expect(
      screen.getByRole('presentation', { hidden: true }),
    ).toBeInTheDocument();
  });

  it('sets sessionStorage flag so it only shows once', () => {
    render(<PixelRobot />);
    act(() => {
      jest.advanceTimersByTime(4100);
    });
    expect(sessionStorage.getItem(SESSION_KEY)).toBe('1');
  });

  it('does not show again when SESSION_KEY is already set', () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    const { container } = render(<PixelRobot />);

    act(() => {
      jest.advanceTimersByTime(15_000);
    });
    expect(container.querySelector('[role="presentation"]')).toBeNull();
  });

  it('cleans up the root timer on unmount', () => {
    const clearSpy = jest.spyOn(globalThis, 'clearTimeout');

    const { unmount } = render(<PixelRobot />);

    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('renders an SVG robot while visible', () => {
    render(<PixelRobot />);
    act(() => {
      jest.advanceTimersByTime(4100);
    });
    const robot = screen.getByRole('presentation', { hidden: true });

    expect(robot.querySelector('svg')).toBeInTheDocument();
  });
});
