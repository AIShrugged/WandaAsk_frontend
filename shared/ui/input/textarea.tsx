import React, {
  forwardRef,
  useId,
  useState,
  type TextareaHTMLAttributes,
} from 'react';

/**
 * cn.
 * @param parts - parts.
 * @returns Result.
 */
const cn = (...parts: Array<string | false | null | undefined>) => {
  return parts.filter(Boolean).join(' ');
};

interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value'> {
  label?: string;
  error?: boolean | string;
  floating?: boolean;
  containerClassName?: string;
  height?: string | number;
  resizable?: boolean;
  value?: string;
  defaultValue?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      label,
      className,
      containerClassName,
      error,
      floating = true,
      height,
      resizable = true,
      onFocus,
      onBlur,
      onChange,
      value: propValue,
      defaultValue,
      placeholder,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const textareaId = id ?? `textarea-${autoId}`;
    const [isFocused, setIsFocused] = useState(false);
    const currentValue = propValue ?? '';
    const hasValue = currentValue.length > 0 || !!placeholder;
    const floatingActive = floating && (isFocused || hasValue);
    /**
     * handleFocus.
     * @param e - e.
     * @returns Result.
     */
    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };
    /**
     * handleBlur.
     * @param e - e.
     * @returns Result.
     */
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };
    /**
     * handleChange.
     * @param e - e.
     * @returns Result.
     */
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
    };

    return (
      <div className={cn('relative flex flex-col w-full', containerClassName)}>
        <div
          className={cn(
            'relative w-full rounded-[var(--radius-button)] border border-input bg-background pl-4 px-1.5 py-3',
            'transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30',
            error ? 'border-destructive' : '',
          )}
          style={height ? { height } : undefined}
        >
          <textarea
            {...rest}
            id={textareaId}
            ref={ref}
            value={propValue}
            defaultValue={defaultValue}
            placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={cn(
              'peer w-full bg-transparent outline-none placeholder-muted-foreground/70',
              'scrollbar-thin scrollbar-thumb-gray-300',
              !height && 'min-h-20 max-h-96 field-sizing-content',
              !resizable && 'resize-none',
              className,
            )}
            style={{
              ...(height && { height: '100%', overflowY: 'auto' }),
            }}
            aria-invalid={!!error}
          />

          {label && (
            <label
              htmlFor={textareaId}
              className={cn(
                'absolute left-4 top-2.5 origin-left pointer-events-none select-none transition-all duration-200 text-sm',
                floatingActive
                  ? '-translate-y-7 scale-90 bg-background px-1 text-xs text-muted-foreground'
                  : 'translate-y-0 scale-100 text-muted-foreground',
                error && 'text-destructive',
              )}
              style={{ zIndex: 10 }}
            >
              {label}
            </label>
          )}
        </div>

        {typeof error === 'string' && (
          <span className='mt-1 text-sm text-destructive'>{error}</span>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
