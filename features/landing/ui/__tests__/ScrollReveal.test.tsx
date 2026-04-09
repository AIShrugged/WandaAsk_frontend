import { act, render } from '@testing-library/react';
import React from 'react';

import { ScrollReveal } from '@/features/landing/ui/ScrollReveal';

type IntersectionObserverCallback = (
  entries: IntersectionObserverEntry[],
) => void;

/** Captured observer callbacks keyed by observed element. */
const observerCallbacks: IntersectionObserverCallback[] = [];
let disconnectMock: jest.Mock;
let observeMock: jest.Mock;
let unobserveMock: jest.Mock;

function setupIntersectionObserverMock() {
  disconnectMock = jest.fn();
  observeMock = jest.fn();
  unobserveMock = jest.fn();

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: jest.fn((cb: IntersectionObserverCallback) => {
      observerCallbacks.push(cb);

      return {
        observe: observeMock,
        unobserve: unobserveMock,
        disconnect: disconnectMock,
      };
    }),
  });
}

describe('ScrollReveal', () => {
  beforeEach(() => {
    observerCallbacks.length = 0;
    setupIntersectionObserverMock();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing (returns null)', () => {
    const { container } = render(<ScrollReveal />);

    expect(container.firstChild).toBeNull();
  });

  it('creates an IntersectionObserver on mount', () => {
    render(<ScrollReveal />);
    expect(IntersectionObserver).toHaveBeenCalledTimes(1);
  });

  it('observes each [data-reveal] element', () => {
    document.body.innerHTML = `
      <div data-reveal></div>
      <div data-reveal></div>
    `;
    render(<ScrollReveal />);
    expect(observeMock).toHaveBeenCalledTimes(2);
    document.body.innerHTML = '';
  });

  it('adds "is-revealed" class when element intersects', () => {
    const el = document.createElement('div');

    el.dataset.reveal = '';
    document.body.append(el);

    render(<ScrollReveal />);

    act(() => {
      observerCallbacks[0]([
        {
          isIntersecting: true,
          target: el,
        } as unknown as IntersectionObserverEntry,
      ]);
    });

    expect(el.classList.contains('is-revealed')).toBe(true);
    el.remove();
  });

  it('does not add class when element does not intersect', () => {
    const el = document.createElement('div');

    el.dataset.reveal = '';
    document.body.append(el);

    render(<ScrollReveal />);

    act(() => {
      observerCallbacks[0]([
        {
          isIntersecting: false,
          target: el,
        } as unknown as IntersectionObserverEntry,
      ]);
    });

    expect(el.classList.contains('is-revealed')).toBe(false);
    el.remove();
  });

  it('applies transition delay from data-reveal-delay attribute', () => {
    const el = document.createElement('div');

    el.dataset.reveal = '';
    el.dataset.revealDelay = '200';
    document.body.append(el);

    render(<ScrollReveal />);

    act(() => {
      observerCallbacks[0]([
        {
          isIntersecting: true,
          target: el,
        } as unknown as IntersectionObserverEntry,
      ]);
    });

    expect(el.style.transitionDelay).toBe('200ms');
    el.remove();
  });

  it('disconnects observer on unmount', () => {
    const { unmount } = render(<ScrollReveal />);

    unmount();
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
