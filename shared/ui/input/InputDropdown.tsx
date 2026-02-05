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
          'px-6 flex items-center rounded-full h-[54px] w-full',
          'border bg-white transition-colors cursor-pointer',
          'focus:border-primary focus:ring-2 focus:ring-offset-0 focus:ring-[#4FB268] outline-none',
          error ? 'border-red-700' : 'border-secondary',
          disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
          'relative',
        )}
      >
        <span
          className={cn(
            'flex-1 truncate py-2.5',
            hasValue ? '' : 'text-transparent',
          )}
        >
          {hasValue ? displayedLabel : placeholder}
        </span>

        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-500 transition-transform ml-2 shrink-0',
            isOpen && 'rotate-180',
          )}
        />

        {label ? (
          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-8 transition-all pointer-events-none select-none',
              floatingActive
                ? '-translate-y-4 scale-100 px-[4px] bg-white text-xs text-tertiary'
                : 'translate-y-0 scale-100 text-secondary',
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

      {isOpen && (
        <div
          ref={dropdownRef}
          role='listbox'
          className='absolute z-50 w-full top-[58px] bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto'
        >
          {searchable && (
            <div className='p-2 border-b border-gray-200 sticky top-0 bg-white'>
              <input
                ref={searchInputRef}
                type='text'
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                placeholder='Search'
                className='w-full px-4 h-[40px] text-sm border border-secondary rounded-full bg-transparent outline-none focus:border-primary focus:ring-2 focus:ring-offset-0 focus:ring-[#4FB268]'
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}

          <ul className='py-1'>
            {filteredOptions.length === 0 ? (
              <li className='px-4 py-3 text-sm text-gray-500'>Nothing found</li>
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
                      'px-4 py-3 flex items-center justify-between cursor-pointer transition-colors text-sm',
                      isHighlighted && 'bg-blue-50',
                      isSelected && 'bg-blue-100 font-medium',
                      option.disabled && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className='w-4 h-4 text=accent ' />}
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
