import Checkbox from '@/shared/ui/input/Checkbox';
import Input from '@/shared/ui/input/Input';
import InputDropdown from '@/shared/ui/input/InputDropdown';
import PasswordInput from '@/shared/ui/input/InputPassword';
import InputTextarea from '@/shared/ui/input/InputTextarea';

import type { DropdownOption } from '@/shared/ui/input/InputDropdown';
import type { ReactNode } from 'react';
import type {
  ControllerRenderProps,
  ControllerFieldState,
} from 'react-hook-form';

type FieldConfig = {
  label: string;
  type: string;
  labelExtra?: ReactNode;
  placeholder?: string;
  options?: DropdownOption[];
  searchable?: boolean;
};

type VariantProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: ControllerRenderProps<any, string>;
  fieldState: ControllerFieldState;
  config: FieldConfig;
};
export const VARIANT_MAPPER = {
  checkbox: function CheckboxVariant({
    field,
    fieldState,
    config,
  }: VariantProps) {
    return (
      <Checkbox
        {...field}
        label={config.label}
        labelExtra={config.labelExtra}
        type={config.type}
        error={fieldState.error?.message}
      />
    );
  },
  input: function InputVariant({ field, fieldState, config }: VariantProps) {
    return (
      <Input
        {...field}
        label={config.label}
        type={config.type}
        error={fieldState.error?.message}
      />
    );
  },
  inputPassword: function InputVariant({
    field,
    fieldState,
    config,
  }: VariantProps) {
    return (
      <PasswordInput
        {...field}
        label={config.label}
        error={fieldState.error?.message}
      />
    );
  },
  inputTextarea: function InputTextareaVariant({
    field,
    fieldState,
    config,
  }: VariantProps) {
    return (
      <InputTextarea
        {...field}
        label={config.label}
        error={fieldState.error?.message}
      />
    );
  },
  select: function SelectVariant({ field, fieldState, config }: VariantProps) {
    return (
      <InputDropdown
        label={config.label}
        placeholder={config.placeholder}
        options={config.options ?? []}
        value={field.value}
        onChange={(val) => {
          return field.onChange(val as string);
        }}
        disabled={field.disabled}
        error={fieldState.error?.message}
        searchable={config.searchable ?? false}
      />
    );
  },
  multiselect: function MultiselectVariant({
    field,
    fieldState,
    config,
  }: VariantProps) {
    return (
      <InputDropdown
        label={config.label}
        placeholder={config.placeholder}
        options={config.options ?? []}
        value={field.value}
        onChange={(val) => {
          return field.onChange(val as string[]);
        }}
        disabled={field.disabled}
        error={fieldState.error?.message}
        searchable={config.searchable ?? false}
        multiple
      />
    );
  },
} as const;

export type VariantType =
  | 'input'
  | 'checkbox'
  | 'inputPassword'
  | 'inputTextarea'
  | 'select'
  | 'multiselect';
