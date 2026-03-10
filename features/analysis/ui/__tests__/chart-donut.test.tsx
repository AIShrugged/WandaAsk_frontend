import { render, screen } from '@testing-library/react';

import ChartDonut from '@/features/analysis/ui/chart-donut';

describe('ChartDonut', () => {
  it('renders the rounded value as text', () => {
    render(<ChartDonut value={75} />);
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('renders 0 for negative values (clamps to 0)', () => {
    render(<ChartDonut value={-10} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders 100 for values above 100 (clamps to 100)', () => {
    render(<ChartDonut value={150} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders 0 for value 0', () => {
    render(<ChartDonut value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders 100 for value 100', () => {
    render(<ChartDonut value={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('rounds float values', () => {
    render(<ChartDonut value={66.7} />);
    expect(screen.getByText('67')).toBeInTheDocument();
  });

  it('applies the given size as container dimensions', () => {
    const { container } = render(<ChartDonut value={50} size={120} />);

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.style.width).toBe('120px');
    expect(wrapper.style.height).toBe('120px');
  });

  it('renders SVG with two circles', () => {
    const { container } = render(<ChartDonut value={50} />);

    const circles = container.querySelectorAll('circle');

    expect(circles).toHaveLength(2);
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(
      <ChartDonut value={50} className='custom-class' />,
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
