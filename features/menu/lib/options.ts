import {
  BarChart2,
  Bot,
  Bug,
  Calendar,
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  SquareKanban,
  File,
  Terminal,
  UsersRound,
  Clock,
  Users,
  CheckSquare,
} from 'lucide-react';

import { ROUTES } from '@/shared/lib/routes';

import type { MenuProps } from '@/features/menu/model/types';

/**
 * Builds the sidebar navigation items for the current user.
 * @param root0 - Options object.
 * @param root0.canManageAgents - Whether the user has the agent-management permission.
 * @returns Array of menu item descriptors to render in the sidebar.
 */
export function getMenuItems({
  canManageAgents,
}: {
  canManageAgents: boolean;
}): MenuProps[] {
  const items: MenuProps[] = [
    {
      id: 'today',
      label: 'Today',
      icon: 'clock',
      href: ROUTES.DASHBOARD.TODAY,
      position: 1,
    },
    {
      id: 'meetings',
      label: 'Meetings',
      icon: 'users',
      href: ROUTES.DASHBOARD.MEETINGS,
      position: 2,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: 'checkSquare',
      href: ROUTES.DASHBOARD.TASKS,
      position: 3,
    },
    {
      id: 'main-dashboard',
      label: 'Dashboard',
      icon: 'layoutDashboard',
      href: ROUTES.DASHBOARD.MAIN,
      position: 10,
    },
    {
      id: 'chat',
      label: 'AI Chat',
      icon: 'messageSquare',
      href: ROUTES.DASHBOARD.CHAT,
      position: 50,
    },
    {
      id: 'issues',
      label: 'Tasktracker',
      icon: 'bug',
      href: ROUTES.DASHBOARD.ISSUES,
      position: 30,
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: 'teams',
      href: ROUTES.DASHBOARD.TEAMS,
      position: 5,
    },
    {
      id: 'methodology',
      label: 'Methodologies',
      icon: 'bookOpen',
      href: ROUTES.DASHBOARD.METHODOLOGY,
      position: 70,
    },
    /* {
      id: 'calendar',
      label: 'Calendar',
      icon: 'calendar',
      href: ROUTES.DASHBOARD.CALENDAR,
      position: 20,
    },*/
    {
      id: 'follow-ups',
      label: 'Follow ups (meetings)',
      icon: 'file',
      href: ROUTES.DASHBOARD.FOLLOWUPS,
      position: 60,
    },
  ];
  const isDev =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'development';

  if (isDev) {
    items.push({
      id: 'debug',
      label: 'Debug',
      icon: 'terminal',
      href: ROUTES.DASHBOARD.DEBUG,
      activeHref: ROUTES.DASHBOARD.DEBUG,
      position: 10_000,
    });
  }

  if (canManageAgents) {
    items.push({
      id: 'agents',
      label: 'Agents',
      icon: 'bot',
      href: ROUTES.DASHBOARD.AGENTS,
      activeHref: ROUTES.DASHBOARD.AGENTS,
      position: 90,
    });
  }

  return items.toSorted((a, b) => {
    return a.position - b.position;
  });
}

export const ICONS_MAP = {
  bot: Bot,
  layoutDashboard: LayoutDashboard,
  teams: UsersRound,
  bookOpen: BookOpen,
  calendar: Calendar,
  file: File,
  kanban: SquareKanban,
  barChart: BarChart2,
  messageSquare: MessageSquare,
  bug: Bug,
  terminal: Terminal,
  clock: Clock,
  users: Users,
  checkSquare: CheckSquare,
} as const;
