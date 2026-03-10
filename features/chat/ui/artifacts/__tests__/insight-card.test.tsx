import { render, screen } from '@testing-library/react';

import { InsightCard } from '@/features/chat/ui/artifacts/insight-card';

const basePerson = { name: 'Anna Smith', profile_id: 1 };

describe('InsightCard', () => {
  it('renders person name when provided', () => {
    render(<InsightCard data={{ person: basePerson, insights: [] }} />);
    expect(screen.getByText('Anna Smith')).toBeInTheDocument();
  });

  it('renders person initials in avatar', () => {
    render(<InsightCard data={{ person: basePerson, insights: [] }} />);
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('renders single initial for one-word name', () => {
    render(
      <InsightCard
        data={{ person: { name: 'Alice', profile_id: 1 }, insights: [] }}
      />,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('does not render person section when person is absent', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<InsightCard data={{ person: null as any, insights: [] }} />);
    expect(screen.queryByText('AS')).not.toBeInTheDocument();
  });

  it('renders insight category label', () => {
    render(
      <InsightCard
        data={{
          person: basePerson,
          insights: [
            { category: 'Communication', content: { style: 'Direct' } },
          ],
        }}
      />,
    );
    expect(screen.getByText('Communication')).toBeInTheDocument();
  });

  it('renders string value with formatted key label', () => {
    render(
      <InsightCard
        data={{
          person: basePerson,
          insights: [
            {
              category: 'Profile',
              content: { communication_style: 'Assertive' },
            },
          ],
        }}
      />,
    );
    expect(screen.getByText('communication style')).toBeInTheDocument();
    expect(screen.getByText('Assertive')).toBeInTheDocument();
  });

  it('renders array values as badge spans', () => {
    render(
      <InsightCard
        data={{
          person: basePerson,
          insights: [
            {
              category: 'Skills',
              content: { strengths: ['Leadership', 'Empathy'] },
            },
          ],
        }}
      />,
    );
    expect(screen.getByText('Leadership')).toBeInTheDocument();
    expect(screen.getByText('Empathy')).toBeInTheDocument();
  });

  it('renders multiple insight sections', () => {
    render(
      <InsightCard
        data={{
          person: basePerson,
          insights: [
            { category: 'Section A', content: { note: 'Value A' } },
            { category: 'Section B', content: { note: 'Value B' } },
          ],
        }}
      />,
    );
    expect(screen.getByText('Section A')).toBeInTheDocument();
    expect(screen.getByText('Section B')).toBeInTheDocument();
  });

  it('skips empty array values', () => {
    const { container } = render(
      <InsightCard
        data={{
          person: basePerson,
          insights: [{ category: 'Empty', content: { tags: [] } }],
        }}
      />,
    );

    // No badge spans rendered for empty array
    const badges = container.querySelectorAll('.rounded-full');

    // Avatar circle only — no badge spans
    expect(badges).toHaveLength(1);
  });
});
