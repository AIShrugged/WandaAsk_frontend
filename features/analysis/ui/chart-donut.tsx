import type { ComponentProps } from 'react';

interface DonutChartProps extends ComponentProps<'div'> {
  value: number;
  size?: number;
  strokeWidth?: number;
  textClassName?: string;
}

export default function ChartDonut({
  value,
  size = 200,
  strokeWidth = 30,
  className = '',
  textClassName = '',
  ...props
}: DonutChartProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * normalizedValue) / 100;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className='absolute rotate-[-90deg]'
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke='#e0fad8'
          strokeWidth={strokeWidth}
          fill='none'
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke='#4FB268'
          strokeWidth={strokeWidth}
          fill='none'
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap='round'
          className='transition-all duration-1000 ease-out'
        />
      </svg>

      <div
        className={`absolute font-bold text-accent select-none ${textClassName}`}
        style={{ fontSize: size * 0.28 }}
      >
        {Math.round(normalizedValue)}
      </div>
    </div>
  );
}
