import { render, screen } from '@testing-library/react';

import { PasswordStrengthBar } from '@/features/auth/ui/password-strength-bar';

describe('PasswordStrengthBar', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrengthBar password='' />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows Weak for password shorter than 8 chars', () => {
    render(<PasswordStrengthBar password='abc' />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('shows Medium for password with 8+ chars and one complexity factor', () => {
    render(<PasswordStrengthBar password='password1' />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('shows Strong for 12+ chars with 2+ complexity factors', () => {
    render(<PasswordStrengthBar password='StrongPass1!' />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('renders meter role with correct aria attributes', () => {
    render(<PasswordStrengthBar password='abc12' />);
    const meter = screen.getByRole('meter', { name: /password strength/i });

    expect(meter).toHaveAttribute('aria-valuemin', '1');
    expect(meter).toHaveAttribute('aria-valuemax', '3');
    expect(meter).toHaveAttribute('aria-valuenow');
  });
});
