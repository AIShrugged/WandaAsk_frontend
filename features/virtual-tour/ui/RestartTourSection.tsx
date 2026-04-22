'use client';

/**
 * RestartTourSection component.
 * Renders a placeholder card on the profile page for the onboarding tour (currently disabled).
 * @returns JSX element.
 */
export function RestartTourSection() {
  return (
    <div className='bg-card border border-border rounded-[var(--radius-card)] p-6 mt-6'>
      <h3 className='text-base font-semibold text-foreground'>
        Onboarding Tour
      </h3>
      <p className='text-sm text-muted-foreground mt-1 mb-4'>
        Restart the guided tour to revisit all core features of WandaAsk at any
        time.
      </p>
    </div>
  );
}
