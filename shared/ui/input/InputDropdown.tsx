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

const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

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

  const selectedValues = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value
      ? [value]
      : [];

  const selectedLabels = selectedValues
    .map(val => options.find(opt => opt.value === val)?.label)
    .filter(Boolean);

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

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectOption = (option: DropdownOption) => {
    if (option.disabled) return;

    let newValue: string | string[];

    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      const exists = current.includes(option.value);
      newValue = exists
        ? current.filter(v => v !== option.value)
        : [...current, option.value];
    } else {
      newValue = option.value;
      setIsOpen(false);
      setSearchQuery('');
    }

    onChange?.(newValue);
  };

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen(prev => !prev);
      if (!isOpen && searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev,
          );
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions]);

  useEffect(() => {
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useImperativeHandle(ref, () => ({
    focus: () => triggerRef.current?.focus(),
    clear: () => onChange?.(multiple ? [] : ''),
  }));

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
        onKeyDown={e => {
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
            hasValue ? 'text-foreground' : 'text-muted-foreground/50',
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
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                placeholder='Search'
                className='w-full px-3 h-8 text-sm border border-input rounded-[var(--radius-button)] bg-transparent outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 focus:ring-offset-0'
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}

          <ul className='py-1'>
            {filteredOptions.length === 0 ? (
              <li className='px-4 py-3 text-sm text-muted-foreground'>Nothing found</li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = selectedValues.includes(option.value);
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={option.value}
                    role='option'
                    aria-selected={isSelected}
                    onClick={() => selectOption(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors text-sm',
                      isHighlighted && 'bg-accent',
                      isSelected && 'bg-accent font-medium',
                      option.disabled && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className='w-4 h-4 text-primary' />}
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
