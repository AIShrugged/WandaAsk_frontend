import { render, screen } from '@testing-library/react';
import React from 'react';

import { TribesLogo } from '@/shared/ui/brand/TribesLogo';
import { WandaLogo } from '@/shared/ui/brand/WandaLogo';

describe('TribesLogo', () => {
  it('renders the app name', () => {
    render(<TribesLogo />);
    expect(screen.getByText('Tribes')).toBeInTheDocument();
  });

  it('renders the "T" monogram', () => {
    render(<TribesLogo />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    const { container } = render(<TribesLogo className='custom-class' />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('WandaLogo', () => {
  it('is an alias for TribesLogo and renders the app name', () => {
    render(<WandaLogo />);
    expect(screen.getByText('Tribes')).toBeInTheDocument();
  });
});
