/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ButtonsRow from '@/features/meeting/ui/buttons-row';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { replace: mockReplace };
    },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ButtonsRow', () => {
  it('renders all four tab buttons', () => {
    render(<ButtonsRow currentTab='summary' />);
    expect(
      screen.getByRole('button', { name: 'Overview' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Follow-up' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Transcript' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Analysis' }),
    ).toBeInTheDocument();
  });

  it('marks the active tab with primary style', () => {
    render(<ButtonsRow currentTab='transcript' />);
    const transcriptBtn = screen.getByRole('button', { name: 'Transcript' });

    expect(transcriptBtn).toHaveClass('bg-primary');
  });

  it('inactive tabs do not have primary style', () => {
    render(<ButtonsRow currentTab='summary' />);
    const followup = screen.getByRole('button', { name: 'Follow-up' });

    expect(followup).not.toHaveClass('bg-primary');
  });

  it('navigates to correct tab on click', async () => {
    render(<ButtonsRow currentTab='summary' />);
    await userEvent.click(screen.getByRole('link', { name: 'Analysis' }));
    expect(mockReplace).toHaveBeenCalledWith('?tab=analysis', {
      scroll: false,
    });
  });
});
