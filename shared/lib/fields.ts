export const emailField = {
  variant: 'input' as const,
  name: 'email',
  label: 'Email',
  type: 'email',
  placeholder: 'Email Address',
  rules: {
    required: 'Email is required',
    pattern: {
      // eslint-disable-next-line sonarjs/slow-regex
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    },
  },
};
