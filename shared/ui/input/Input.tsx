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

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(true);
    onFocus?.(e);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(false);
    onBlur?.(e);
  }

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
          'px-4 flex items-center rounded-[var(--radius-button)] h-9 w-full relative',
          'bg-[var(--background)] transition-shadow [&_input]:focus-visible:shadow-none',
          error
            ? 'shadow-[inset_0_0_0_1px_var(--destructive)] focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_35%,transparent)]'
            : 'shadow-[inset_0_0_0_1px_var(--border)] focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_35%,transparent)]',
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
            'peer bg-transparent outline-none w-full placeholder-[var(--muted-foreground)]/70 py-2 text-[var(--primary)] font-bold',
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
                ? '-translate-y-5 scale-90 px-1 bg-[var(--background)] text-xs text-[var(--muted-foreground)]'
                : 'translate-y-0 scale-100 text-[var(--muted-foreground)]',
              startAdornment ? 'left-8' : 'left-4',
              error ? 'text-destructive' : '',
            )}
            style={
              {
                zIndex: 10,
                top: floatingActive ? -9 : '50%',
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
