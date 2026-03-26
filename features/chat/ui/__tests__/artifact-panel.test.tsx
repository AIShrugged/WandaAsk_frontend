/* eslint-disable jsdoc/require-jsdoc */
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mockGetArtifacts = jest.fn();

jest.mock('@/entities/artifact/api/artifacts', () => {
  return {
    getArtifacts: (...args: unknown[]) => {
      return mockGetArtifacts(...args);
    },
  };
});

jest.mock('@/shared/ui/layout/collapsed-side-panel', () => {
  return {
    CollapsedSidePanel: ({
      label,
      onExpand,
    }: {
      label: string;
      onExpand: () => void;
    }) => {
      return (
        <div data-testid='collapsed-panel'>
          <span>{label}</span>
          <button
            aria-label={`Expand ${label.toLowerCase()} panel`}
            onClick={onExpand}
          >
            Expand
          </button>
        </div>
      );
    },
  };
});

// Stub artifact sub-components
jest.mock('@/features/chat/ui/artifacts/chart-artifact', () => {
  return {
    ChartArtifactView: () => {
      return <div data-testid='chart-artifact' />;
    },
  };
});
jest.mock('@/features/chat/ui/artifacts/insight-card', () => {
  return {
    InsightCard: () => {
      return <div data-testid='insight-card' />;
    },
  };
});
jest.mock('@/features/chat/ui/artifacts/meeting-card', () => {
  return {
    MeetingCard: () => {
      return <div data-testid='meeting-card' />;
    },
  };
});
jest.mock('@/features/chat/ui/artifacts/people-list', () => {
  return {
    PeopleList: () => {
      return <div data-testid='people-list' />;
    },
  };
});
jest.mock('@/features/chat/ui/artifacts/task-table', () => {
  return {
    TaskTable: () => {
      return <div data-testid='task-table' />;
    },
  };
});
jest.mock('@/features/chat/ui/artifacts/transcript-view', () => {
  return {
    TranscriptView: () => {
      return <div data-testid='transcript-view' />;
    },
  };
});

// Stub Lucide icons
jest.mock('lucide-react', () => {
  const Icon = ({ className }: { className?: string }) => {
    return <span className={className} />;
  };

  return {
    BarChart2: Icon,
    ChevronLeft: Icon,
    ClipboardList: Icon,
    FileText: Icon,
    Loader2: Icon,
    RefreshCw: Icon,
    Sparkles: Icon,
    Users: Icon,
    Video: Icon,
    Zap: Icon,
  };
});

import { ArtifactPanel } from '@/features/chat/ui/artifact-panel';

import type { ArtifactsResponse } from '@/features/chat/types';

const ARTIFACT_ID = 'a1';

const ARTIFACT_TITLE = 'My Artifact';

const makeArtifacts = (type = 'task_table'): ArtifactsResponse => {
  return {
    layout: { items: [{ id: ARTIFACT_ID }] },
    artifacts: {
      a1: {
        id: ARTIFACT_ID,
        type: type as 'task_table',
        title: ARTIFACT_TITLE,
        status: 'done',
        data: {} as never,
      },
    },
  };
};

const user = userEvent.setup({ delay: null });

describe('ArtifactPanel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockGetArtifacts.mockResolvedValue(makeArtifacts());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders "No artifacts yet" when initialArtifacts is null', () => {
    render(<ArtifactPanel chatId={1} initialArtifacts={null} />);
    expect(screen.getByText('No artifacts yet')).toBeInTheDocument();
  });

  it('renders artifact title when initialArtifacts are provided', () => {
    render(<ArtifactPanel chatId={1} initialArtifacts={makeArtifacts()} />);
    expect(screen.getByText(ARTIFACT_TITLE)).toBeInTheDocument();
  });

  it('shows artifact count badge', () => {
    render(<ArtifactPanel chatId={1} initialArtifacts={makeArtifacts()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('collapses the panel when collapse button is clicked', async () => {
    render(<ArtifactPanel chatId={1} initialArtifacts={makeArtifacts()} />);
    await user.click(
      screen.getByRole('button', { name: /collapse artifacts panel/i }),
    );
    expect(screen.queryByText(ARTIFACT_TITLE)).not.toBeInTheDocument();
  });

  it('expands the panel again after collapsing', async () => {
    render(<ArtifactPanel chatId={1} initialArtifacts={makeArtifacts()} />);
    await user.click(
      screen.getByRole('button', { name: /collapse artifacts panel/i }),
    );
    await user.click(
      screen.getByRole('button', { name: /expand artifacts panel/i }),
    );
    expect(screen.getByText(ARTIFACT_TITLE)).toBeInTheDocument();
  });

  it('calls getArtifacts and refreshes on Refresh button click', async () => {
    render(<ArtifactPanel chatId={1} initialArtifacts={makeArtifacts()} />);
    await act(async () => {
      await user.click(
        screen.getByRole('button', { name: /refresh artifacts/i }),
      );
    });
    await waitFor(() => {
      expect(mockGetArtifacts).toHaveBeenCalledWith(1);
    });
  });

  it('renders generating status card with status badge', () => {
    const data: ArtifactsResponse = {
      layout: { items: [{ id: ARTIFACT_ID }] },
      artifacts: {
        a1: {
          id: ARTIFACT_ID,
          type: 'task_table',
          title: 'Loading...',
          status: 'generating',
          data: {} as never,
        },
      },
    };

    render(<ArtifactPanel chatId={1} initialArtifacts={data} />);
    // Status badge text
    expect(screen.getByText('Generating\u2026')).toBeInTheDocument();
  });

  it('renders failed status card', () => {
    const data: ArtifactsResponse = {
      layout: { items: [{ id: ARTIFACT_ID }] },
      artifacts: {
        a1: {
          id: ARTIFACT_ID,
          type: 'task_table',
          title: 'Failed artifact',
          status: 'failed',
          data: {} as never,
        },
      },
    };

    render(<ArtifactPanel chatId={1} initialArtifacts={data} />);
    expect(screen.getByText('Failed to generate')).toBeInTheDocument();
  });
});
