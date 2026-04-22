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

export function getMenuItems(): MenuProps[] {
  const items: MenuProps[] = [
    {
      id: 'today',
      label: 'Dashboard',
      icon: 'clock',
      href: ROUTES.DASHBOARD.TODAY,
      position: 1,
    },
    {
      id: 'meetings',
      label: 'Meetings',
      icon: 'calendar',
      href: ROUTES.DASHBOARD.MEETINGS,
      position: 2,
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
      label: 'Tasks',
      icon: 'checkSquare',
      href: ROUTES.DASHBOARD.ISSUES,
      position: 3,
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
    {
      id: 'follow-ups',
      label: 'Follow ups (meetings)',
      icon: 'file',
      href: ROUTES.DASHBOARD.FOLLOWUPS,
      position: 60,
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: 'bot',
      href: ROUTES.DASHBOARD.AGENTS,
      activeHref: ROUTES.DASHBOARD.AGENTS,
      position: 90,
    },
  ];

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
