export const ROUTES = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ORGANIZATION: '/auth/organization',
  },
  DASHBOARD: {
    HOME: 'dashboard',
    CALENDAR: '/dashboard/calendar',
    CHAT: '/dashboard/chat',
    MEETING: '/dashboard/meeting',
    TEAMS: '/dashboard/teams',
    METHODOLOGY: '/dashboard/methodology',
    STATISTICS: '/dashboard/statistics',
    FOLLOWUPS: '/dashboard/follow-ups',
    ORGANIZATION: '/dashboard/organization',
  },
} as const;
