import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BUTTON_SIZE, BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: 'Click me' }),
    ).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();

    render(<Button onClick={onClick}>Submit</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when loading is true', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loadingText when loading', () => {
    render(
      <Button loading loadingText='Saving...'>
        Submit
      </Button>,
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('shows default loadingText "Please wait" when loading without loadingText', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = jest.fn();

    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies secondary variant classes', () => {
    render(<Button variant={BUTTON_VARIANT.secondary}>Secondary</Button>);
    const btn = screen.getByRole('button');

    expect(btn.className).toContain('border');
  });

  it('applies danger variant classes', () => {
    render(<Button variant={BUTTON_VARIANT.danger}>Delete</Button>);
    const btn = screen.getByRole('button');

    expect(btn.className).toContain('destructive');
  });

  it('forwards extra HTML attributes', () => {
    render(<Button data-testid='my-btn'>OK</Button>);
    expect(screen.getByTestId('my-btn')).toBeInTheDocument();
  });

  it('sets aria-disabled when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('applies ghost-danger variant classes', () => {
    render(<Button variant={BUTTON_VARIANT.ghostDanger}>Delete Org</Button>);
    const btn = screen.getByRole('button');

    expect(btn.className).toContain('border-destructive');
    expect(btn.className).toContain('text-destructive');
  });

  it('applies sm size classes', () => {
    render(<Button size={BUTTON_SIZE.sm}>Small</Button>);
    const btn = screen.getByRole('button');

    expect(btn.className).toContain('h-9');
    expect(btn.className).toContain('px-4');
  });

  it('applies md size classes by default', () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole('button');

    expect(btn.className).toContain('h-10');
    expect(btn.className).toContain('px-6');
  });
});
