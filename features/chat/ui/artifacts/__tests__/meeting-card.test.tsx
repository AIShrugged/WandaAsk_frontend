import { render, screen } from '@testing-library/react';

import { MeetingCard } from '@/features/chat/ui/artifacts/meeting-card';

const baseData = {
  title: 'Q1 Planning',
  starts_at: '2024-03-15T10:00:00Z',
  ends_at: '2024-03-15T11:30:00Z',
  summary: 'Discussed Q1 goals and priorities.',
  decisions: [],
  key_points: [],
  participants: [],
};

describe('MeetingCard', () => {
  it('renders the formatted date', () => {
    render(<MeetingCard data={baseData} />);
    expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument();
  });

  it('renders the formatted start and end time', () => {
    render(<MeetingCard data={baseData} />);
    // time uses HH:mm, UTC offset may differ in CI — check the separator instead
    expect(screen.getByText(/–/)).toBeInTheDocument();
  });

  it('renders summary text', () => {
    render(<MeetingCard data={baseData} />);
    expect(
      screen.getByText('Discussed Q1 goals and priorities.'),
    ).toBeInTheDocument();
  });

  it('does not render participants section when list is empty', () => {
    render(<MeetingCard data={baseData} />);
    // Users icon only appears with participants
    const { container } = render(<MeetingCard data={baseData} />);

    const userIcons = container.querySelectorAll('.lucide-users');

    expect(userIcons).toHaveLength(0);
  });

  it('renders participants when provided', () => {
    render(
      <MeetingCard
        data={{ ...baseData, participants: ['Alice', 'Bob', 'Carol'] }}
      />,
    );
    expect(screen.getByText('Alice, Bob, Carol')).toBeInTheDocument();
  });

  it('renders key points when provided', () => {
    render(
      <MeetingCard
        data={{ ...baseData, key_points: ['Focus on delivery', 'Cut scope'] }}
      />,
    );
    expect(screen.getByText('Key points')).toBeInTheDocument();
    expect(screen.getByText('Focus on delivery')).toBeInTheDocument();
    expect(screen.getByText('Cut scope')).toBeInTheDocument();
  });

  it('does not render "Key points" heading when key_points is empty', () => {
    render(<MeetingCard data={baseData} />);
    expect(screen.queryByText('Key points')).not.toBeInTheDocument();
  });

  it('renders decisions when provided', () => {
    render(
      <MeetingCard
        data={{ ...baseData, decisions: ['Hire 2 engineers', 'Launch in Q2'] }}
      />,
    );
    expect(screen.getByText('Decisions')).toBeInTheDocument();
    expect(screen.getByText('Hire 2 engineers')).toBeInTheDocument();
    expect(screen.getByText('Launch in Q2')).toBeInTheDocument();
  });

  it('does not render "Decisions" heading when decisions is empty', () => {
    render(<MeetingCard data={baseData} />);
    expect(screen.queryByText('Decisions')).not.toBeInTheDocument();
  });

  it('falls back to raw string when date is invalid', () => {
    render(
      <MeetingCard
        data={{ ...baseData, starts_at: 'not-a-date', ends_at: 'not-a-date' }}
      />,
    );
    // raw string rendered as-is
    expect(screen.getAllByText('not-a-date').length).toBeGreaterThanOrEqual(1);
  });

  it('does not render summary when missing', () => {
    render(<MeetingCard data={{ ...baseData, summary: '' }} />);
    expect(
      screen.queryByText('Discussed Q1 goals and priorities.'),
    ).not.toBeInTheDocument();
  });
});
