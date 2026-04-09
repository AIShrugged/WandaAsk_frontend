import { render, screen } from '@testing-library/react';
import React from 'react';

import MeetingTasks from '@/features/meeting/ui/meeting-tasks';

import type { MeetingTask } from '@/features/meeting/types';

function makeTask(overrides: Partial<MeetingTask> = {}): MeetingTask {
  return {
    id: 1,
    taskable_type: 'CalendarEvent',
    taskable_id: 42,
    profile_id: null,
    title: 'Follow up with client',
    description: null,
    assignee_name: null,
    due_date: null,
    status: 'open',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    ...overrides,
  };
}

describe('MeetingTasks', () => {
  it('renders empty state when no tasks', () => {
    render(<MeetingTasks tasks={[]} />);
    expect(
      screen.getByText(/no tasks found for this meeting/i),
    ).toBeInTheDocument();
  });

  it('renders task count', () => {
    render(
      <MeetingTasks
        tasks={[makeTask(), makeTask({ id: 2, title: 'Second task' })]}
      />,
    );
    expect(screen.getByText('2 tasks')).toBeInTheDocument();
  });

  it('renders singular "task" for a single task', () => {
    render(<MeetingTasks tasks={[makeTask()]} />);
    expect(screen.getByText('1 task')).toBeInTheDocument();
  });

  it('renders task title', () => {
    render(<MeetingTasks tasks={[makeTask({ title: 'Write report' })]} />);
    expect(screen.getByText('Write report')).toBeInTheDocument();
  });

  it('renders task description when present', () => {
    render(
      <MeetingTasks tasks={[makeTask({ description: 'Detailed notes' })]} />,
    );
    expect(screen.getByText('Detailed notes')).toBeInTheDocument();
  });

  it('does not render description when absent', () => {
    render(<MeetingTasks tasks={[makeTask({ description: null })]} />);
    expect(screen.queryByText(/detailed notes/i)).not.toBeInTheDocument();
  });

  it('renders assignee name when present', () => {
    render(<MeetingTasks tasks={[makeTask({ assignee_name: 'Alice' })]} />);
    expect(screen.getByText(/alice/i)).toBeInTheDocument();
  });

  it('renders formatted due date when present', () => {
    render(
      <MeetingTasks tasks={[makeTask({ due_date: '2026-04-15T00:00:00Z' })]} />,
    );
    expect(screen.getByText(/15 Apr 2026/)).toBeInTheDocument();
  });

  it('does not render due date when null', () => {
    render(<MeetingTasks tasks={[makeTask({ due_date: null })]} />);
    expect(screen.queryByText(/due:/i)).not.toBeInTheDocument();
  });

  it('does not throw for an invalid due_date string', () => {
    expect(() => {
      render(<MeetingTasks tasks={[makeTask({ due_date: 'not-a-date' })]} />);
    }).not.toThrow();
  });

  it('renders status badge for "open"', () => {
    render(<MeetingTasks tasks={[makeTask({ status: 'open' })]} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders status badge for "done"', () => {
    render(<MeetingTasks tasks={[makeTask({ status: 'done' })]} />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders status badge for "in_progress"', () => {
    render(<MeetingTasks tasks={[makeTask({ status: 'in_progress' })]} />);
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('renders status badge for "cancelled"', () => {
    render(<MeetingTasks tasks={[makeTask({ status: 'cancelled' })]} />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });
});
