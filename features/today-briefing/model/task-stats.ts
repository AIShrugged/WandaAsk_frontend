import type { TodayBriefing } from './types';

export interface TaskStats {
  totalActive: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export function computeTaskStats(data: TodayBriefing): TaskStats {
  // Carried tasks in progress
  const carriedInProgress = data.carried_tasks.filter((t) => {
    return t.status === 'in_progress';
  }).length;

  // Meeting tasks (flat across all events)
  const allMeetingTasks = data.events.flatMap((e) => {
    return e.tasks;
  });
  const meetingInProgress = allMeetingTasks.filter((t) => {
    return t.status === 'in_progress';
  }).length;
  const overdue = allMeetingTasks.filter((t) => {
    return t.is_overdue;
  }).length;

  // Completed: sum of done_tasks_count from each event
  const completed = data.events.reduce((sum, e) => {
    return sum + e.done_tasks_count;
  }, 0);

  // Total active = carried + waiting_on_you + non-done meeting tasks
  // Note: WaitingTask has no status field — counted only in total, not in-progress
  const activeMeetingTasks = allMeetingTasks.filter((t) => {
    return t.status !== 'done';
  }).length;
  const totalActive =
    data.carried_tasks.length + data.waiting_on_you.length + activeMeetingTasks;

  return {
    totalActive,
    inProgress: carriedInProgress + meetingInProgress,
    completed,
    overdue,
  };
}
