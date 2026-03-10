import { render } from '@testing-library/react';

import { ScrollReveal } from '@/features/landing/ui/ScrollReveal';

// jsdom doesn't implement IntersectionObserver
const mockObserver = {
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
};

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: jest.fn(() => {
    return mockObserver;
  }),
});

describe('ScrollReveal', () => {
  it('renders null (no DOM output)', () => {
    const { container } = render(<ScrollReveal />);

    expect(container.firstChild).toBeNull();
  });

  it('mounts without errors', () => {
    expect(() => {
      return render(<ScrollReveal />);
    }).not.toThrow();
  });
});
