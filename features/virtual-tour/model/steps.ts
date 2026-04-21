import type { TourStep } from './types';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to WandaAsk',
    description:
      'WandaAsk is your AI-powered HR assistant. In the next few steps we will walk you through the core features — teams, meetings, tasks, and AI chat. It takes about 2 minutes.',
  },
  {
    id: 'create-organization',
    title: 'Create Your Organization',
    description:
      'Organizations group your people and data together. Everything in WandaAsk — teams, meetings, and insights — belongs to an organization. Make sure yours is set up before inviting colleagues.',
    route: '/dashboard/today',
  },
  {
    id: 'meet-the-layout',
    title: 'Meet the Layout',
    description:
      'The sidebar on the left gives you quick access to all sections. The main area shows the active page. On larger screens a chat panel appears on the right — you can hide it any time.',
    route: '/dashboard/today',
  },
  {
    id: 'create-team',
    title: 'Create a Team',
    description:
      'Teams organize people into groups for collaboration and insights. Head to the Teams section and click "Create Team" to get started. You can create as many teams as you need.',
    route: '/dashboard/teams',
  },
  {
    id: 'invite-team-members',
    title: 'Invite Team Members',
    description:
      'Once your team is created, invite colleagues by email. They will receive an invitation and can join your organization. Wanda will start building insights as soon as your team grows.',
    route: '/dashboard/teams',
  },
  {
    id: 'ai-chat',
    title: 'AI Chat — Ask Wanda',
    description:
      'The chat panel lets you ask Wanda anything in natural language: "Who attended last week\'s standups?", "What tasks are overdue?", or "Show me the DISC profile for Alice". Try it now.',
    route: '/dashboard/today',
  },
  {
    id: 'meetings-agenda',
    title: 'Meetings & Agenda',
    description:
      'The Meetings section shows your upcoming and past meetings. Connect Google Calendar in the next step and Wanda will automatically summarize meetings, extract decisions, and create tasks.',
    route: '/dashboard/meetings',
  },
  {
    id: 'issues-kanban',
    title: 'Issues & Kanban',
    description:
      'Track action items and tasks in the Issues section. Switch to the Kanban view for a visual board. Wanda automatically creates tasks from meeting summaries and follow-up assessments.',
    route: '/dashboard/issues',
  },
  {
    id: 'connect-google-calendar',
    title: 'Connect Google Calendar',
    description:
      'Connecting your Google Calendar unlocks the full power of Wanda: automatic meeting summaries, participant insights, and follow-up task generation. Click below to authorize in one step.',
    route: '/dashboard/profile/calendar',
    isLast: true,
  },
];
