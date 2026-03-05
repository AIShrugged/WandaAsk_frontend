'use client';

import React, { forwardRef, useId, useState } from 'react';

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

/**
 * cn.
 * @param parts - parts.
 * @returns Result.
 */
const cn = (...parts: Array<string | false | null | undefined>) => {
  return parts.filter(Boolean).join(' ');
};

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

  const [isFocused, setIsFocused] = useState(false);

  const hasValue =
    (value || rest.placeholder) !== undefined && (value || '').length > 0;

  /**
   * handleFocus.
   * @param e - e.
   * @returns Result.
   */
  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(true);
    onFocus?.(e);
  }

  /**
   * handleBlur.
   * @param e - e.
   * @returns Result.
   */
  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(false);
    onBlur?.(e);
  }

  /**
   * handleChange.
   * @param e - e.
   * @returns Result.
   */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
          'px-4 flex items-center rounded-[var(--radius-button)] h-10 w-full',
          'border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 focus-within:ring-offset-0',
          error ? 'border-destructive' : '',
          'relative',
        )}
      >
        {startAdornment ? (
          <div className='flex items-center mr-2'>{startAdornment}</div>
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
            'peer bg-transparent outline-none w-full placeholder-muted-foreground/50 py-2',
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
              'absolute left-3 transition-all pointer-events-none select-none text-sm',
              floatingActive
                ? '-translate-y-5 scale-90 px-[4px] bg-background text-xs text-muted-foreground'
                : 'translate-y-0 scale-100 text-muted-foreground',
              startAdornment ? 'left-8' : 'left-4',
              error ? 'text-destructive' : '',
            )}
            style={
              {
                zIndex: 10,
                top: floatingActive ? -2 : '50%',
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
