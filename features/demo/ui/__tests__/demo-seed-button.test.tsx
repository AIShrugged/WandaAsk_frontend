/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-returns, import/order */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: jest.fn() };
    },
  };
});

jest.mock('@/features/demo/api/get-demo-status', () => {
  return {
    getDemoStatus: jest.fn(),
  };
});

jest.mock('@/features/demo/api/seed-demo', () => {
  return {
    seedDemo: jest.fn(),
  };
});

jest.mock('sonner', () => {
  return {
    toast: { error: jest.fn(), success: jest.fn() },
  };
});

jest.mock('lucide-react', () => {
  return {
    Sparkles: () => {
      return <span data-testid='sparkles' />;
    },
    Minus: () => {
      return <span>minus</span>;
    },
    Plus: () => {
      return <span>plus</span>;
    },
    Loader2: () => {
      return <span data-testid='loader2' />;
    },
  };
});

jest.mock('@/shared/ui/layout/spin-loader', () => {
  return {
    __esModule: true,
    default: () => {
      return <span data-testid='spin-loader' />;
    },
  };
});

jest.mock('@/shared/ui/button/Button', () => {
  return {
    Button: ({
      children,
      onClick,
      type,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      type?: string;
    }) => {
      return (
        <button
          type={(type as 'button' | 'submit' | 'reset') ?? 'button'}
          onClick={onClick}
        >
          {children}
        </button>
      );
    },
  };
});

jest.mock('@/shared/ui/input/InputDropdown', () => {
  return {
    __esModule: true,
    default: () => {
      return <div data-testid='input-dropdown' />;
    },
  };
});

import { toast } from 'sonner';

import { getDemoStatus } from '@/features/demo/api/get-demo-status';
import { seedDemo } from '@/features/demo/api/seed-demo';
import DemoSeedButton from '@/features/demo/ui/demo-seed-button';

const mockGetDemoStatus = getDemoStatus as jest.Mock;

const mockSeedDemo = seedDemo as jest.Mock;

// userEvent instance without delays so it works regardless of timer mocking
const user = userEvent.setup({ delay: null });

/** Render and flush the mount-time getDemoStatus call. */
async function renderAndFlush() {
  const result = render(<DemoSeedButton />);

  await act(async () => {
    await Promise.resolve();
  });

  return result;
}

describe('DemoSeedButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDemoStatus.mockResolvedValue(null);
    mockSeedDemo.mockResolvedValue();
  });

  it('renders the trigger button', async () => {
    await renderAndFlush();
    expect(
      screen.getByRole('button', { name: /generate demo data/i }),
    ).toBeInTheDocument();
  });

  it('shows "Create Demo" label', async () => {
    await renderAndFlush();
    expect(screen.getByText('Create Demo')).toBeInTheDocument();
  });

  it('opens dropdown on trigger click', async () => {
    await renderAndFlush();
    await user.click(
      screen.getByRole('button', { name: /generate demo data/i }),
    );
    expect(screen.getByText('Demo data')).toBeInTheDocument();
    expect(screen.getByText('Configure and generate')).toBeInTheDocument();
  });

  it('closes dropdown on second trigger click', async () => {
    await renderAndFlush();
    const trigger = screen.getByRole('button', { name: /generate demo data/i });

    await user.click(trigger);
    await user.click(trigger);
    expect(screen.queryByText('Demo data')).not.toBeInTheDocument();
  });

  it('shows teams, employees and meetings options in dropdown', async () => {
    await renderAndFlush();
    await user.click(
      screen.getByRole('button', { name: /generate demo data/i }),
    );
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Employees per team')).toBeInTheDocument();
    expect(screen.getByText('Meetings per team')).toBeInTheDocument();
  });

  it('calls seedDemo with default values on Generate click', async () => {
    await renderAndFlush();
    await user.click(
      screen.getByRole('button', { name: /generate demo data/i }),
    );
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Generate' }));
    });
    expect(mockSeedDemo).toHaveBeenCalledWith({
      teams_count: 1,
      employees_per_team: 7,
      meetings_per_team: 3,
    });
  });

  it('shows error toast when seedDemo rejects', async () => {
    mockSeedDemo.mockRejectedValue(new Error('Network error'));
    await renderAndFlush();
    await user.click(
      screen.getByRole('button', { name: /generate demo data/i }),
    );
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      await Promise.resolve();
    });
    expect(toast.error).toHaveBeenCalledWith('Network error');
  });

  it('shows "Demo generating" label while seedDemo is in-flight', async () => {
    mockSeedDemo.mockReturnValue(new Promise(() => {}));
    await renderAndFlush();
    await user.click(
      screen.getByRole('button', { name: /generate demo data/i }),
    );
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Generate' }));
    });
    expect(screen.getByText(/demo generating/i)).toBeInTheDocument();
  });

  it('disables trigger button while pending', async () => {
    mockSeedDemo.mockReturnValue(new Promise(() => {}));
    await renderAndFlush();
    await user.click(
      screen.getByRole('button', { name: /generate demo data/i }),
    );
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Generate' }));
    });
    expect(
      screen.getByRole('button', { name: /generate demo data/i }),
    ).toBeDisabled();
  });

  it('starts polling and shows generating state if initial status is pending', async () => {
    mockGetDemoStatus.mockResolvedValue({
      status: 'pending',
      progress_percent: 0,
      current_step_label: 'Queued',
    });
    render(<DemoSeedButton />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText(/demo generating/i)).toBeInTheDocument();
  });

  it('stays idle if initial status is ready', async () => {
    mockGetDemoStatus.mockResolvedValue({
      status: 'ready',
      progress_percent: 100,
      current_step_label: 'Done',
    });
    render(<DemoSeedButton />);
    await act(async () => {
      await Promise.resolve();
    });
    // not pending — no generating label
    expect(screen.queryByText(/demo generating/i)).not.toBeInTheDocument();
  });
});

describe('SegmentedControl (via DemoSeedButton)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDemoStatus.mockResolvedValue(null);
    mockSeedDemo.mockResolvedValue();
  });

  it('changes teams count when a segment is clicked', async () => {
    await act(async () => {
      render(<DemoSeedButton />);
      await Promise.resolve();
    });
    await user.click(
      screen.getByRole('button', { name: /generate demo data/i }),
    );
    // Teams segmented control contains buttons 1, 2, 3 (there are multiple "2"s).
    // The teams control is the first segmented control — its buttons come first in the DOM.
    const allButtons = screen.getAllByRole('button');

    // button[0]=trigger, then teams: 1,2,3; employees stepper: -,+; meetings: 1,2,3,4,5,6; Generate
    const teamsTwo = allButtons[2]; // 0=trigger, 1=team-1, 2=team-2

    await user.click(teamsTwo);
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Generate' }));
    });
    expect(seedDemo).toHaveBeenCalledWith(
      expect.objectContaining({ teams_count: 2 }),
    );
  });

  it('changes meetings per team when a segment is clicked', async () => {
    await act(async () => {
      render(<DemoSeedButton />);
      await Promise.resolve();
    });
    await user.click(
      screen.getByRole('button', { name: /generate demo data/i }),
    );
    // Meetings segmented control options: 1,2,3,4,5,6 — pick "6" (unique text)
    const buttons = screen.getAllByRole('button');

    const seg6 = buttons.find((b) => {
      return b.textContent === '6';
    });

    await user.click(seg6!);
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Generate' }));
    });
    expect(seedDemo).toHaveBeenCalledWith(
      expect.objectContaining({ meetings_per_team: 6 }),
    );
  });
});

describe('Stepper (via DemoSeedButton)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDemoStatus.mockResolvedValue(null);
    mockSeedDemo.mockResolvedValue();
  });

  it('increments employees per team', async () => {
    await act(async () => {
      render(<DemoSeedButton />);
      await Promise.resolve();
    });
    await user.click(
      screen.getByRole('button', { name: /generate demo data/i }),
    );
    const plusButton = screen.getAllByRole('button').find((b) => {
      return b.textContent?.includes('plus');
    });

    await user.click(plusButton);
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Generate' }));
    });
    expect(seedDemo).toHaveBeenCalledWith(
      expect.objectContaining({ employees_per_team: 8 }),
    );
  });

  it('decrements employees per team', async () => {
    await act(async () => {
      render(<DemoSeedButton />);
      await Promise.resolve();
    });
    await user.click(
      screen.getByRole('button', { name: /generate demo data/i }),
    );
    const minusButton = screen.getAllByRole('button').find((b) => {
      return b.textContent?.includes('minus');
    });

    await user.click(minusButton);
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Generate' }));
    });
    expect(seedDemo).toHaveBeenCalledWith(
      expect.objectContaining({ employees_per_team: 6 }),
    );
  });

  it('does not go below min for employees', async () => {
    await act(async () => {
      render(<DemoSeedButton />);
      await Promise.resolve();
    });
    await user.click(
      screen.getByRole('button', { name: /generate demo data/i }),
    );
    const minusButton = screen.getAllByRole('button').find((b) => {
      return b.textContent?.includes('minus');
    });

    // Click minus many times — should clamp to min (3)
    for (let i = 0; i < 10; i++) {
      await user.click(minusButton);
    }
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Generate' }));
    });
    expect(seedDemo).toHaveBeenCalledWith(
      expect.objectContaining({ employees_per_team: 3 }),
    );
  });
});
