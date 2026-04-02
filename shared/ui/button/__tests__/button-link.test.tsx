import { render, screen } from '@testing-library/react';

import { BUTTON_SIZE, BUTTON_VARIANT } from '@/shared/types/button';
import { ButtonLink } from '@/shared/ui/button/button-link';

describe('ButtonLink', () => {
  it('renders children as a link', () => {
    render(<ButtonLink href='/dashboard'>Go to Dashboard</ButtonLink>);
    expect(
      screen.getByRole('link', { name: 'Go to Dashboard' }),
    ).toBeInTheDocument();
  });

  it('sets href correctly', () => {
    render(<ButtonLink href='/auth/login'>Sign In</ButtonLink>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/auth/login');
  });

  it('applies primary variant classes by default', () => {
    render(<ButtonLink href='/'>Primary</ButtonLink>);
    const link = screen.getByRole('link');

    expect(link.className).toContain('from-violet-500');
  });

  it('applies secondary variant classes', () => {
    render(
      <ButtonLink href='/' variant={BUTTON_VARIANT.secondary}>
        Secondary
      </ButtonLink>,
    );
    const link = screen.getByRole('link');

    expect(link.className).toContain('border-input');
  });

  it('applies ghost-danger variant classes', () => {
    render(
      <ButtonLink href='/' variant={BUTTON_VARIANT.ghostDanger}>
        Danger
      </ButtonLink>,
    );
    const link = screen.getByRole('link');

    expect(link.className).toContain('border-destructive');
    expect(link.className).toContain('text-destructive');
  });

  it('applies sm size classes', () => {
    render(
      <ButtonLink href='/' size={BUTTON_SIZE.sm}>
        Small
      </ButtonLink>,
    );
    const link = screen.getByRole('link');

    expect(link.className).toContain('h-9');
    expect(link.className).toContain('px-4');
  });

  it('applies md size classes by default', () => {
    render(<ButtonLink href='/'>Default</ButtonLink>);
    const link = screen.getByRole('link');

    expect(link.className).toContain('h-10');
    expect(link.className).toContain('px-6');
  });

  it('sets target and rel for external links', () => {
    render(
      <ButtonLink href='https://example.com' external>
        External
      </ButtonLink>,
    );
    const link = screen.getByRole('link');

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('accepts custom className', () => {
    render(
      <ButtonLink href='/' className='my-custom-class'>
        Custom
      </ButtonLink>,
    );
    expect(screen.getByRole('link').className).toContain('my-custom-class');
  });
});
