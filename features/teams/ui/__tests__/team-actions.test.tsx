/* eslint-disable jsdoc/require-jsdoc, import/order */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: jest.fn(), replace: jest.fn() };
    },
    usePathname: () => {
      return '/dashboard/teams';
    },
    useSearchParams: () => {
      return new URLSearchParams();
    },
  };
});

jest.mock('sonner', () => {
  return {
    toast: { success: jest.fn(), error: jest.fn() },
  };
});

jest.mock('@/features/teams/api/team', () => {
  return {
    deleteTeam: jest.fn(),
  };
});

jest.mock('@/features/teams/model/teams-store', () => {
  return {
    useTeamsStore: {
      getState: () => {
        return { invalidate: jest.fn() };
      },
    },
  };
});

jest.mock('@/shared/hooks/use-modal', () => {
  return {
    useModal: () => {
      return { open: jest.fn(), close: jest.fn() };
    },
  };
});

jest.mock('@/features/teams/ui/team-member-add-modal', () => {
  return {
    __esModule: true,
    default: () => {
      return <div>TeamMemberAddModal</div>;
    },
  };
});

jest.mock('lucide-react', () => {
  return {
    ChevronRightIcon: () => {
      return <span data-testid='chevron-icon' />;
    },
    Trash: () => {
      return <span data-testid='trash-icon' />;
    },
    UserPlus: () => {
      return <span data-testid='user-plus-icon' />;
    },
  };
});

jest.mock('@/shared/ui/button/button-icon', () => {
  return {
    ButtonIcon: ({
      onClickAction,
      icon,
      disabled,
    }: {
      onClickAction: () => void;
      icon: React.ReactNode;
      disabled?: boolean;
    }) => {
      return (
        <button onClick={onClickAction} disabled={disabled}>
          {icon}
        </button>
      );
    },
  };
});

import { toast } from 'sonner';

import { deleteTeam } from '@/features/teams/api/team';
import { TeamActions } from '@/features/teams/ui/team-actions';

import type { TeamActionType } from '@/entities/team';

const mockDeleteTeam = deleteTeam as jest.Mock;

const TRASH_ICON = 'trash-icon';

const user = userEvent.setup({ delay: null });

describe('TeamActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders delete button when actions includes "delete"', () => {
    render(<TeamActions id={1} actions={['delete']} />);
    expect(screen.getByTestId(TRASH_ICON)).toBeInTheDocument();
  });

  it('renders add-member button when actions includes "add-member"', () => {
    render(<TeamActions id={1} actions={['add-member']} />);
    expect(screen.getByTestId('user-plus-icon')).toBeInTheDocument();
  });

  it('renders view button when actions includes "view"', () => {
    render(<TeamActions id={1} actions={['view']} />);
    expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();
  });

  it('renders all three buttons when all actions provided', () => {
    const actions: TeamActionType[] = ['delete', 'add-member', 'view'];

    render(<TeamActions id={1} actions={actions} />);
    expect(screen.getByTestId(TRASH_ICON)).toBeInTheDocument();
    expect(screen.getByTestId('user-plus-icon')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();
  });

  it('calls deleteTeam and shows success toast on delete', async () => {
    mockDeleteTeam.mockResolvedValue(null);
    render(<TeamActions id={5} actions={['delete']} />);
    await act(async () => {
      await user.click(screen.getByTestId(TRASH_ICON).closest('button')!);
    });
    expect(mockDeleteTeam).toHaveBeenCalledWith(5);
    expect(toast.success).toHaveBeenCalledWith('Команда успешно удалена');
  });

  it('shows error toast when deleteTeam returns an error', async () => {
    mockDeleteTeam.mockResolvedValue({ message: 'not allowed' });
    render(<TeamActions id={3} actions={['delete']} />);
    await act(async () => {
      await user.click(screen.getByTestId(TRASH_ICON).closest('button')!);
    });
    expect(toast.error).toHaveBeenCalledWith('Не удалось удалить команду');
  });

  it('shows error toast when deleteTeam throws', async () => {
    mockDeleteTeam.mockRejectedValue(new Error('network'));
    render(<TeamActions id={3} actions={['delete']} />);
    await act(async () => {
      await user.click(screen.getByTestId(TRASH_ICON).closest('button')!);
    });
    expect(toast.error).toHaveBeenCalledWith(
      'Произошла ошибка при удалении команды',
    );
  });

  it('renders nothing when actions is empty', () => {
    const { container } = render(<TeamActions id={1} actions={[]} />);

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.children).toHaveLength(0);
  });
});
