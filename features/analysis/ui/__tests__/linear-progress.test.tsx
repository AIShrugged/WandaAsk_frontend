import { render } from '@testing-library/react';

import LinearProgress from '@/features/analysis/ui/linear-progress';

const baseProps = {
  display_name: 'Test',
  frontend_component_type: 'progress',
  max_value: 10,
  min_value: 0,
};

describe('LinearProgress', () => {
  it('renders 50% width when current is half of max', () => {
    const { container } = render(
      <LinearProgress {...baseProps} current_value={5} max_value={10} />,
    );

    const bar = container.querySelector('.bg-primary') as HTMLElement;

    expect(bar.style.width).toBe('50%');
  });

  it('renders 100% width when current equals max', () => {
    const { container } = render(
      <LinearProgress {...baseProps} current_value={10} max_value={10} />,
    );

    const bar = container.querySelector('.bg-primary') as HTMLElement;

    expect(bar.style.width).toBe('100%');
  });

  it('renders 0% width when current is 0', () => {
    const { container } = render(
      <LinearProgress {...baseProps} current_value={0} max_value={10} />,
    );

    const bar = container.querySelector('.bg-primary') as HTMLElement;

    expect(bar.style.width).toBe('0%');
  });

  it('clamps to 100% when current exceeds max', () => {
    const { container } = render(
      <LinearProgress {...baseProps} current_value={20} max_value={10} />,
    );

    const bar = container.querySelector('.bg-primary') as HTMLElement;

    expect(bar.style.width).toBe('100%');
  });

  it('clamps to 0% when current is negative', () => {
    const { container } = render(
      <LinearProgress {...baseProps} current_value={-5} max_value={10} />,
    );

    const bar = container.querySelector('.bg-primary') as HTMLElement;

    expect(bar.style.width).toBe('0%');
  });

  it('renders the outer rounded container', () => {
    const { container } = render(
      <LinearProgress {...baseProps} current_value={5} max_value={10} />,
    );

    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
  });
});
