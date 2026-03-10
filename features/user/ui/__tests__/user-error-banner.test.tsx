import { render, screen } from '@testing-library/react';

import UserErrorBanner from '@/features/user/ui/user-error-banner';

describe('UserErrorBanner', () => {
  it('renders "Server Error" message for server type', () => {
    render(<UserErrorBanner type='server' />);
    expect(screen.getByText('Server Error')).toBeInTheDocument();
  });

  it('renders "User not found" message for notFound type', () => {
    render(<UserErrorBanner type='notFound' />);
    expect(screen.getByText('User not found')).toBeInTheDocument();
  });

  it('renders an icon for server type', () => {
    const { container } = render(<UserErrorBanner type='server' />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders an icon for notFound type', () => {
    const { container } = render(<UserErrorBanner type='notFound' />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
