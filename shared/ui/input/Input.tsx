'use client';

import React, { forwardRef, useId, useState, useEffect } from 'react';

import Error from '@/shared/ui/input/Error';

export interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean | string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  floating?: boolean;
  containerClassName?: string;
  value: string;
}

const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  {
    id,
    label,
    className,
    containerClassName,
    error,
    startAdornment,
    endAdornment,
    floating = true,
    onFocus,
    onBlur,
    onChange,
    value,
    defaultValue,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `input-${autoId}`;
  const errorId = `${inputId}-error`;

  // local state to track focus and (when uncontrolled) value
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState<string | undefined>(
    defaultValue === undefined ? undefined : String(defaultValue),
  );

  useEffect(() => {
    if (value === undefined) return;
    setInternalValue(String(value ?? ''));
  }, [value]);

  const hasValue =
    (value ?? internalValue ?? rest.placeholder) !== undefined &&
    (value ?? internalValue ?? '').toString().length > 0;

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(true);
    onFocus?.(e);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(false);
    onBlur?.(e);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  }

  const floatingActive = floating && (isFocused || hasValue);

  return (
    <div
      className={cn(
        'relative flex flex-col items-start w-full',
        containerClassName ?? '',
      )}
    >
      <div
        className={cn(
          'px-6 flex items-center rounded-full h-[54px] w-full',
          'border bg-white transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-offset-0 focus-within:ring-[#4FB268]',
          error ? 'border-red-700' : 'border-secondary',
          'relative',
        )}
      >
        {startAdornment ? (
          <div className='flex items-center mr-2 pl-2'>{startAdornment}</div>
        ) : null}

        <input
          {...rest}
          id={inputId}
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={cn(
            'peer bg-transparent outline-none w-full placeholder-transparent py-2.5',
            className ?? '',
          )}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />

        {endAdornment ? (
          <div className='flex items-center ml-2'>{endAdornment}</div>
        ) : null}

        {label ? (
          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-3 transition-all pointer-events-none select-none',
              floatingActive
                ? '-translate-y-4 scale-100 px-[4px] bg-white text-xs text-tertiary'
                : 'translate-y-0 scale-100 text-secondary',
              startAdornment ? 'left-10' : 'left-8',
              error ? 'text-red-600' : '',
            )}
            style={
              {
                zIndex: 10,
                top: floatingActive ? -10 : '50%',
                transformOrigin: 'left center',
                translate: floatingActive ? '0' : '0 -50%',
              } as React.CSSProperties
            }
          >
            {label}
          </label>
        ) : null}
      </div>

      {typeof error === 'string' ? <Error id={errorId}>{error}</Error> : null}
    </div>
  );
});

export default Input;
