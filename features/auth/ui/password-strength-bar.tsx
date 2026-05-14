'use client';

type Strength = 'weak' | 'medium' | 'strong';

const STRENGTH_LEVELS: Record<Strength, number> = {
  weak: 1,
  medium: 2,
  strong: 3,
};

const BAR_COLORS: Record<Strength, string> = {
  weak: 'bg-red-400',
  medium: 'bg-yellow-500',
  strong: 'bg-green-500',
};

const TEXT_COLORS: Record<Strength, string> = {
  weak: 'text-red-400',
  medium: 'text-yellow-500',
  strong: 'text-green-500',
};

const LABELS: Record<Strength, string> = {
  weak: 'Weak',
  medium: 'Medium',
  strong: 'Strong',
};

function getPasswordStrength(password: string): Strength {
  if (password.length < 8) return 'weak';

  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  if (password.length >= 12 && score >= 2) return 'strong';
  if (score >= 1) return 'medium';

  return 'weak';
}

export function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const level = STRENGTH_LEVELS[strength];

  return (
    <div
      role='meter'
      aria-label='Password strength'
      aria-valuenow={level}
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuetext={LABELS[strength]}
      className='mt-1.5 space-y-1'
    >
      <div className='flex gap-1' aria-hidden='true'>
        {[1, 2, 3].map((n) => {
          return (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                n <= level ? BAR_COLORS[strength] : 'bg-muted'
              }`}
            />
          );
        })}
      </div>
      <p className={`text-xs ${TEXT_COLORS[strength]}`} aria-hidden='true'>
        {LABELS[strength]}
      </p>
    </div>
  );
}
