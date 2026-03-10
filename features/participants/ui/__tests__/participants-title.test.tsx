import { render, screen } from '@testing-library/react';

import ParticipantsTitle from '@/features/participants/ui/participants-title';

describe('ParticipantsTitle', () => {
  it('renders children text', () => {
    render(<ParticipantsTitle>Attendees</ParticipantsTitle>);
    expect(screen.getByText('Attendees')).toBeInTheDocument();
  });

  it('renders as paragraph', () => {
    const { container } = render(<ParticipantsTitle>Guests</ParticipantsTitle>);

    expect(container.querySelector('p')).toBeInTheDocument();
  });
});
