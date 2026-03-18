/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MethodologiesAction } from '@/features/methodology/ui/methodologies-action';

import type { MethodologyProps } from '@/features/methodology/model/types';

const DELETE_BTN = 'delete-btn';

const EDIT_BTN = 'edit-btn';

const mockDeleteMethodology = jest.fn();

const mockRemoveItem = jest.fn();

const mockToastSuccess = jest.fn();

const mockToastError = jest.fn();

jest.mock('@/features/methodology/api/methodology', () => {
  return {
    deleteMethodology: (...args: unknown[]) => {
      return mockDeleteMethodology(...args);
    },
  };
});

jest.mock('@/features/methodology/model/methodology-store', () => {
  return {
    useMethodologyStore: (
      selector: (state: { removeItem: typeof mockRemoveItem }) => unknown,
    ) => {
      return selector({ removeItem: mockRemoveItem });
    },
  };
});

jest.mock('sonner', () => {
  return {
    toast: {
      success: (...args: unknown[]) => {
        return mockToastSuccess(...args);
      },
      error: (...args: unknown[]) => {
        return mockToastError(...args);
      },
    },
  };
});

jest.mock('@/shared/ui/button/button-icon', () => {
  return {
    ButtonIcon: ({
      icon,
      disabled,
      onClickAction,
      href,
    }: {
      icon: React.ReactNode;
      disabled?: boolean;
      onClickAction?: () => void;
      href?: string;
    }) => {
      if (href) {
        return (
          <a href={href} aria-disabled={disabled} data-testid={EDIT_BTN}>
            {icon}
          </a>
        );
      }

      return (
        <button
          disabled={disabled}
          onClick={onClickAction}
          data-testid={DELETE_BTN}
        >
          {icon}
        </button>
      );
    },
  };
});

const makeMethodology = (id: number): MethodologyProps => {
  return {
    id,
    name: `My Methodology`,
    text: 'content',
    organization_id: '1',
    team_ids: [],
    is_default: false,
    teams: [],
  };
};

describe('MethodologiesAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders edit and delete buttons', () => {
    render(<MethodologiesAction methodology={makeMethodology(2)} />);

    expect(screen.getByTestId(EDIT_BTN)).toBeInTheDocument();
    expect(screen.getByTestId(DELETE_BTN)).toBeInTheDocument();
  });

  it('disables both buttons for the default methodology (id=1)', () => {
    render(<MethodologiesAction methodology={makeMethodology(1)} />);

    expect(screen.getByTestId(DELETE_BTN)).toBeDisabled();
    expect(screen.getByTestId(EDIT_BTN)).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('enables buttons for non-default methodology', () => {
    render(<MethodologiesAction methodology={makeMethodology(2)} />);

    expect(screen.getByTestId(DELETE_BTN)).not.toBeDisabled();
  });

  it('calls deleteMethodology with methodology id on delete', async () => {
    mockDeleteMethodology.mockResolvedValueOnce();

    const user = userEvent.setup();

    render(<MethodologiesAction methodology={makeMethodology(5)} />);

    await user.click(screen.getByTestId(DELETE_BTN));

    expect(mockDeleteMethodology).toHaveBeenCalledWith(5);
  });

  it('shows success toast after successful delete', async () => {
    mockDeleteMethodology.mockResolvedValueOnce();

    const user = userEvent.setup();

    render(<MethodologiesAction methodology={makeMethodology(5)} />);

    await user.click(screen.getByTestId(DELETE_BTN));

    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining('My Methodology'),
    );
  });

  it('shows error toast when delete fails', async () => {
    mockDeleteMethodology.mockRejectedValueOnce(new Error('server error'));

    const user = userEvent.setup();

    render(<MethodologiesAction methodology={makeMethodology(5)} />);

    await user.click(screen.getByTestId(DELETE_BTN));

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('My Methodology'),
    );
  });
});
