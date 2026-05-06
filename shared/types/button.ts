export const BUTTON_VARIANT = {
  primary: 'primary',
  secondary: 'secondary',
  danger: 'danger',
  ghostDanger: 'ghost-danger',
  ghost: 'ghost',
  pill: 'pill',
} as const;

export type ButtonVariant =
  (typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];

export const BUTTON_SIZE = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
} as const;

export type ButtonSize = (typeof BUTTON_SIZE)[keyof typeof BUTTON_SIZE];
