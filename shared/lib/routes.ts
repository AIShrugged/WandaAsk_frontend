export const ROUTES = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ORGANIZATION: '/auth/organization',
  },
  DASHBOARD: {
    HOME: 'dashboard',
    TODAY: '/dashboard/today',
    TODAY_MEETINGS: '/dashboard/today/meetings',
    TODAY_TASKS: '/dashboard/today/tasks',
    TODAY_ACTIVITY: '/dashboard/today/activity',
    MEETINGS: '/dashboard/meetings',
    TASKS: '/dashboard/tasks',
    CALENDAR: '/dashboard/calendar',
    CHAT: '/dashboard/chat',
    ISSUES: '/dashboard/issues',
    AGENTS: '/dashboard/agents',
    AGENT_PROFILES: '/dashboard/agents/profiles',
    AGENT_PROFILES_NEW: '/dashboard/agents/profiles/new',
    AGENT_TASKS: '/dashboard/agents/tasks',
    AGENT_TASKS_NEW: '/dashboard/agents/tasks/new',
    AGENT_ACTIVITY: '/dashboard/agents/activity',
    TELEGRAM_CHATS: '/dashboard/chat/telegram',
    TEAMS: '/dashboard/teams',
    TEAMS_CREATE: '/dashboard/teams/create',
    METHODOLOGY: '/dashboard/methodology',
    STATISTICS: '/dashboard/statistics',
    FOLLOWUPS: '/dashboard/follow-ups',
    ORGANIZATION: '/dashboard/organization',
    PROFILE: '/dashboard/profile',
    PROFILE_ACCOUNT: '/dashboard/profile/account',
    PROFILE_PASSWORD: '/dashboard/profile/password', // eslint-disable-line sonarjs/no-hardcoded-passwords
    PROFILE_CALENDAR: '/dashboard/profile/calendar',
    PROFILE_MENU: '/dashboard/profile/menu',
    SUMMARY: '/dashboard/summary',
    KANBAN: '/dashboard/kanban',
    ISSUES_LIST: '/dashboard/issues/list',
    ISSUES_KANBAN: '/dashboard/issues/kanban',
    MEETINGS_LIST: '/dashboard/meetings/list',
    MEETINGS_CALENDAR: '/dashboard/meetings/calendar',
    MEETINGS_ORGANIZATION: '/dashboard/meetings/organization',
    MEETING_DETAIL: (id: string | number) => {
      return `/dashboard/meetings/${id}`;
    },
    MEETING_DETAIL_OVERVIEW: (id: string | number) => {
      return `/dashboard/meetings/${id}/overview`;
    },
    MEETING_DETAIL_AGENDA: (id: string | number) => {
      return `/dashboard/meetings/${id}/agenda`;
    },
    MEETING_DETAIL_TASKS: (id: string | number) => {
      return `/dashboard/meetings/${id}/tasks`;
    },
    MEETING_DETAIL_TRANSCRIPT: (id: string | number) => {
      return `/dashboard/meetings/${id}/transcript`;
    },
  },
} as const;
