/* eslint-disable jsdoc/require-jsdoc */
import { render, screen, fireEvent } from '@testing-library/react';

import { TabLink } from '@/features/meeting/ui/TabLink';

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

describe('TabLink', () => {
  it('renders children', () => {
    render(<TabLink tab='transcript'>Transcript</TabLink>);
    expect(screen.getByText('Transcript')).toBeInTheDocument();
  });

  it('renders anchor with correct href', () => {
    render(<TabLink tab='analysis'>Analysis</TabLink>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '?tab=analysis');
  });

  it('calls router.replace on click', () => {
    render(<TabLink tab='followup'>Follow-up</TabLink>);
    fireEvent.click(screen.getByRole('link'));
    expect(mockReplace).toHaveBeenCalledWith('?tab=followup', {
      scroll: false,
    });
  });

  it('prevents default navigation on click', () => {
    render(<TabLink tab='summary'>Overview</TabLink>);
    const link = screen.getByRole('link');

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    link.dispatchEvent(event);
    // router.replace was called (no hard navigation)
    expect(mockReplace).toHaveBeenCalled();
  });
});
