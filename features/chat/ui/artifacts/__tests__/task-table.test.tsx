import { render, screen } from '@testing-library/react';

import { TaskTable } from '@/features/chat/ui/artifacts/task-table';

/**
 *
 * @param overrides
 */
const makeTask = (overrides = {}) => {
  return {
    title: 'Fix login bug',
    status: 'open',
    due_date: null,
    description: '',
    assignee_name: '',
    ...overrides,
  };
};

describe('TaskTable', () => {
  it('renders "No tasks yet" when tasks array is empty', () => {
    render(<TaskTable data={{ tasks: [] }} />);
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
  });

  it('renders task title', () => {
    render(<TaskTable data={{ tasks: [makeTask()] }} />);
    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
  });

  it('renders "Open" label for open status', () => {
    render(<TaskTable data={{ tasks: [makeTask({ status: 'open' })] }} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders "In progress" label for in_progress status', () => {
    render(
      <TaskTable data={{ tasks: [makeTask({ status: 'in_progress' })] }} />,
    );
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('renders "Done" label for done status', () => {
    render(<TaskTable data={{ tasks: [makeTask({ status: 'done' })] }} />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders "Closed" label for closed status', () => {
    render(<TaskTable data={{ tasks: [makeTask({ status: 'closed' })] }} />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('renders raw status for unknown status', () => {
    render(<TaskTable data={{ tasks: [makeTask({ status: 'pending' })] }} />);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('renders em dash when due_date is null', () => {
    render(<TaskTable data={{ tasks: [makeTask({ due_date: null })] }} />);
    // em dash not rendered — due_date section only shows when truthy
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('renders formatted due date when provided', () => {
    render(
      <TaskTable
        data={{ tasks: [makeTask({ due_date: '2024-06-01T00:00:00Z' })] }}
      />,
    );
    expect(screen.getByText('Jun 1, 2024')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <TaskTable
        data={{ tasks: [makeTask({ description: 'Reproduce and fix' })] }}
      />,
    );
    expect(screen.getByText('Reproduce and fix')).toBeInTheDocument();
  });

  it('renders assignee name when provided', () => {
    render(
      <TaskTable data={{ tasks: [makeTask({ assignee_name: 'John Doe' })] }} />,
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders multiple tasks', () => {
    render(
      <TaskTable
        data={{
          tasks: [
            makeTask({ title: 'Task A' }),
            makeTask({ title: 'Task B' }),
            makeTask({ title: 'Task C' }),
          ],
        }}
      />,
    );
    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Task B')).toBeInTheDocument();
    expect(screen.getByText('Task C')).toBeInTheDocument();
  });
});
