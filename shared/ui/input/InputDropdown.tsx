'use client';

import { ChevronDown, Check } from 'lucide-react';
import React, {
  useState,
  useRef,
  useEffect,
  useId,
  forwardRef,
  useImperativeHandle,
} from 'react';

import Error from '@/shared/ui/input/Error';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface InputDropdownProps {
  options: DropdownOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  multiple?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  error?: boolean | string;
}

/**
 * cn.
 * @param parts - parts.
 * @returns Result.
 */
const cn = (...parts: Array<string | false | null | undefined>) => {
  return parts.filter(Boolean).join(' ');
};

const InputDropdown = forwardRef<
  { focus: () => void; clear: () => void },
  InputDropdownProps
>((props, ref) => {
  const {
    options = [],
    value,
    onChange,
    placeholder = 'Select',
    label,
    multiple = false,
    disabled = false,
    searchable = true,
    className,
    error,
  } = props;

  const autoId = useId();

  const inputId = `dropdown-${autoId}`;

  const errorId = `${inputId}-error`;

  const [isOpen, setIsOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const triggerRef = useRef<HTMLDivElement>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  let selectedValues: string[];

  if (multiple) {
    selectedValues = Array.isArray(value) ? value : [];
  } else {
    selectedValues = value ? [value as string] : [];
  }

  const selectedLabels = selectedValues
    .map((val) => {
      return options.find((opt) => {
        return opt.value === val;
      })?.label;
    })
    .filter(Boolean);

  /**
   * getMultipleDisplayLabel.
   */
  const getMultipleDisplayLabel = (): string => {
    if (selectedLabels.length === 0) return '';

    if (selectedLabels.length === 1) return selectedLabels[0] ?? '';

    return `${selectedLabels[0]} +${selectedLabels.length - 1}`;
  };

  const displayedLabel = multiple
    ? getMultipleDisplayLabel()
    : (selectedLabels[0] ?? '');

  const hasValue = displayedLabel.length > 0;

  const floatingActive = isOpen || hasValue;

  const filteredOptions = options.filter((option) => {
    return option.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  /**
   * selectOption.
   * @param option - option.
   * @returns Result.
   */
  const selectOption = (option: DropdownOption) => {
    if (option.disabled) return;

    let newValue: string | string[];

    if (multiple) {
      const current = Array.isArray(value) ? value : [];

      const exists = current.includes(option.value);

      newValue = exists
        ? current.filter((v) => {
            return v !== option.value;
          })
        : [...current, option.value];
    } else {
      newValue = option.value;
      setIsOpen(false);
      setSearchQuery('');
    }

    onChange?.(newValue);
  };

  /**
   * toggleOpen.
   */
  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen((prev) => {
        return !prev;
      });

      if (!isOpen && searchable) {
        setTimeout(() => {
          return searchInputRef.current?.focus();
        }, 0);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    /**
     * handleKeyDown.
     * @param e - e.
     * @returns Result.
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setHighlightedIndex((prev) => {
            return prev < filteredOptions.length - 1 ? prev + 1 : prev;
          });
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setHighlightedIndex((prev) => {
            return prev > 0 ? prev - 1 : -1;
          });
          break;
        }
        case 'Enter': {
          e.preventDefault();

          if (highlightedIndex >= 0) {
            selectOption(filteredOptions[highlightedIndex]);
          }
          break;
        }
        case 'Escape': {
          setIsOpen(false);
          setSearchQuery('');
          triggerRef.current?.focus();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      return document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, highlightedIndex, filteredOptions]);

  useEffect(() => {
    /**
     * handleClickOutside.
     * @param e - e.
     * @returns Result.
     */
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      return document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useImperativeHandle(ref, () => {
    return {
      /**
       * focus.
       */
      focus: () => {
        return triggerRef.current?.focus();
      },
      /**
       * clear.
       */
      clear: () => {
        return onChange?.(multiple ? [] : '');
      },
    };
  });

  return (
    <div className={cn('relative flex flex-col items-start w-full', className)}>
      <div
        ref={triggerRef}
        tabIndex={disabled ? undefined : 0}
        role='combobox'
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleOpen();
          }
        }}
        className={cn(
          'px-4 flex items-center rounded-[var(--radius-button)] h-10 w-full',
          'border border-input bg-background transition-colors cursor-pointer',
          'focus:border-ring focus:ring-2 focus:ring-ring/30 focus:ring-offset-0 outline-none',
          error ? 'border-destructive' : '',
          disabled && 'opacity-60 cursor-not-allowed',
          'relative',
        )}
      >
        <span
          className={cn(
            'flex-1 truncate py-2 text-sm',
            hasValue ? 'text-foreground' : 'text-muted-foreground/70',
          )}
        >
          {hasValue ? displayedLabel : placeholder}
        </span>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform ml-2 shrink-0',
            isOpen && 'rotate-180',
          )}
        />

        {label ? (
          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-4 transition-all pointer-events-none select-none text-sm',
              floatingActive
                ? '-translate-y-5 scale-90 px-[4px] bg-background text-xs text-muted-foreground'
                : 'translate-y-0 scale-100 text-muted-foreground',
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

      {isOpen && (
        <div
          ref={dropdownRef}
          role='listbox'
          className='absolute z-50 w-full top-[44px] bg-popover border border-border rounded-[var(--radius-card)] shadow-card max-h-80 overflow-auto'
        >
          {searchable && (
            <div className='p-2 border-b border-border sticky top-0 bg-popover'>
              <input
                ref={searchInputRef}
                type='text'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                placeholder='Search'
                className='w-full px-3 h-8 text-sm border border-input rounded-[var(--radius-button)] bg-transparent outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 focus:ring-offset-0'
                onClick={(e) => {
                  return e.stopPropagation();
                }}
              />
            </div>
          )}

          <ul className='py-1'>
            {filteredOptions.length === 0 ? (
              <li className='px-4 py-3 text-sm text-muted-foreground'>
                Nothing found
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = selectedValues.includes(option.value);

                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={option.value}
                    role='option'
                    aria-selected={isSelected}
                    onClick={() => {
                      return selectOption(option);
                    }}
                    onMouseEnter={() => {
                      return setHighlightedIndex(index);
                    }}
                    className={cn(
                      'px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors text-sm',
                      // bg-accent is terminal green — must use accent-foreground (black, 9.65:1) not foreground (white, 1.84:1)
                      isHighlighted &&
                        !isSelected &&
                        'bg-accent/20 text-foreground',
                      isSelected && 'bg-primary/15 text-foreground font-medium',
                      option.disabled && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <Check className='w-4 h-4 text-violet-300' />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {typeof error === 'string' ? <Error id={errorId}>{error}</Error> : null}
    </div>
  );
});

InputDropdown.displayName = 'InputDropdown';

export default InputDropdown;
