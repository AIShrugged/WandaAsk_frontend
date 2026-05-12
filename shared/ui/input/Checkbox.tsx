import React, { forwardRef, type ReactNode } from 'react';

const CheckboxIcon = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='12'
      height='10'
      viewBox='0 0 12 10'
      fill='none'
      aria-hidden='true'
    >
      <path d='M4 9.4L0 5.4L1.4 4L4 6.6L10.6 0L12 1.4L4 9.4Z' fill='white' />
    </svg>
  );
};

export interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelExtra?: ReactNode;
  error?: boolean | string;
  containerClassName?: string;
}

const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  {
    id,
    label,
    labelExtra,
    className,
    containerClassName,
    error,
    onChange,
    value,
    defaultValue,
    ...rest
  },
  ref,
) {
  const isChecked = value;
  const baseBorder = error ? 'border-destructive' : 'border-border';
  const checkedStyles = isChecked
    ? 'bg-[var(--primary)] border-[var(--primary)]'
    : 'bg-[var(--background)]';

  return (
    <label
      className={`flex items-center gap-2 cursor-pointer ${containerClassName ?? ''}`}
    >
      {/* Wrapper provides positioning context for the check icon overlay */}
      <span className='relative inline-flex items-center justify-center flex-shrink-0'>
        <input
          ref={ref}
          id={id}
          type='checkbox'
          className={`
            appearance-none
            cursor-pointer
            w-4.5 h-4.5 rounded-[4px]
            border
            ${baseBorder}
            ${checkedStyles}
            transition-colors
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[var(--ring)]
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[var(--background)]
            ${className ?? ''}
          `}
          onChange={onChange}
          checked={!!value}
          defaultValue={defaultValue}
          {...rest}
        />
        {isChecked && (
          <span className='absolute pointer-events-none flex items-center justify-center'>
            <CheckboxIcon />
          </span>
        )}
      </span>

      {label && <span>{label}</span>}
      {labelExtra}
      {rest.children}
    </label>
  );
});

export default Checkbox;
