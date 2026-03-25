import {
  BarChart2,
  Activity,
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
      id: 'main-dashboard',
      label: 'Dashboard',
      icon: 'layoutDashboard',
      href: ROUTES.DASHBOARD.MAIN,
    },
    {
      id: 'chat',
      label: 'AI Chat',
      icon: 'messageSquare',
      href: ROUTES.DASHBOARD.CHAT,
    },
    {
      id: 'issues',
      label: 'Issues',
      icon: 'bug',
      href: ROUTES.DASHBOARD.ISSUES,
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: 'teams',
      href: ROUTES.DASHBOARD.TEAMS,
    },
    {
      id: 'methodology',
      label: 'Methodologies',
      icon: 'bookOpen',
      href: ROUTES.DASHBOARD.METHODOLOGY,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: 'calendar',
      href: ROUTES.DASHBOARD.CALENDAR,
    },
    {
      id: 'follow-ups',
      label: 'Follow ups (meetings)',
      icon: 'file',
      href: ROUTES.DASHBOARD.FOLLOWUPS,
    },
    {
      id: 'kanban',
      label: 'Kanban',
      icon: 'kanban',
      href: ROUTES.DASHBOARD.KANBAN,
    },
  ];

  const isDev =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'development';

  if (isDev) {
    items.push({
      id: 'debug-logs',
      label: 'Debug Logs',
      icon: 'terminal',
      href: ROUTES.DASHBOARD.DEBUG_LOGS,
    });
  }

  if (canManageAgents) {
    items.splice(3, 0, {
      id: 'agent-tasks',
      label: 'Agent Tasks',
      icon: 'bot',
      href: ROUTES.DASHBOARD.AGENT_TASKS,
      activeHref: ROUTES.DASHBOARD.AGENT_TASKS,
    });
    items.splice(4, 0, {
      id: 'agent-profiles',
      label: 'Agent Profiles',
      icon: 'bot',
      href: ROUTES.DASHBOARD.AGENT_PROFILES,
      activeHref: ROUTES.DASHBOARD.AGENT_PROFILES,
    });
    items.splice(5, 0, {
      id: 'agent-activity',
      label: 'Agent Activity',
      icon: 'activity',
      href: ROUTES.DASHBOARD.AGENT_ACTIVITY,
      activeHref: ROUTES.DASHBOARD.AGENT_ACTIVITY,
    });
  }

  return items;
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
  activity: Activity,
  messageSquare: MessageSquare,
  bug: Bug,
  terminal: Terminal,
} as const;
