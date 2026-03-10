import { render, screen } from '@testing-library/react';

import FollowUp from '@/features/follow-up/ui/follow-up';

describe('FollowUp', () => {
  it('renders "No data" when data is empty string', async () => {
    render(await FollowUp({ data: '' }));
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders "Error" for invalid JSON', async () => {
    render(await FollowUp({ data: 'not valid json' }));
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders formatted JSON for valid data', async () => {
    render(await FollowUp({ data: '{"key":"value"}' }));
    expect(screen.getByText(/"key"/)).toBeInTheDocument();
  });

  it('renders in a pre element for valid JSON', async () => {
    const { container } = render(await FollowUp({ data: '{"a":1}' }));

    expect(container.querySelector('pre')).toBeInTheDocument();
  });
});
