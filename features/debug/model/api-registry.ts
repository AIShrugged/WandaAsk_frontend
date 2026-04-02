export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  controller: string;
  auth: boolean;
  frontendCallers: string[];
}

// ── Caller file path constants (used in multiple entries) ─────────────────

const C_AUTH = 'features/auth/api/auth.ts';
const C_AGENTS = 'features/agents/api/agents.ts';
const C_ACTIVITY = 'features/agents/api/activity.ts';
const C_CALENDAR = 'features/calendar/api/calendar.ts';
const C_SOURCE = 'features/calendar/api/source.ts';
const C_CHATS = 'features/chat/api/chats.ts';
const C_MESSAGES = 'features/chat/api/messages.ts';
const C_TELEGRAM = 'features/chat/api/telegram.ts';
const C_CALENDAR_EVENTS = 'features/event/api/calendar-events.ts';
const C_FOLLOW_UP = 'features/follow-up/api/follow-up.ts';
const C_ISSUES = 'features/issues/api/issues.ts';
const C_KANBAN = 'features/kanban/api/kanban.ts';
const C_AGENDAS = 'features/main-dashboard/api/agendas.ts';
const C_UPCOMING_AGENDA = 'features/main-dashboard/api/upcoming-agenda.ts';
const C_METHODOLOGY = 'features/methodology/api/methodology.ts';
const C_METHODOLOGY_CHAT = 'features/methodology/api/methodology-chat.ts';
const C_ORGANIZATION = 'features/organization/api/organization.ts';
const C_PARTICIPANTS = 'features/participants/api/participants.ts';
const C_SUMMARY = 'features/summary/api/summary.ts';
const C_TEAM = 'features/teams/api/team.ts';
const C_NOTIFICATION_SETTINGS = 'features/teams/api/notification-settings.ts';
const C_TRANSCRIPT = 'features/transcript/api/transcript.ts';
const C_USER = 'features/user/api/user.ts';
const C_PROFILE = 'features/user-profile/api/profile.ts';
const C_DEMO_SEED = 'features/demo/api/seed-demo.ts';
const C_DEMO_STATUS = 'features/demo/api/get-demo-status.ts';
const C_DEMO_DELETE = 'features/demo/api/delete-demo.ts';

export const API_REGISTRY: ApiEndpoint[] = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  {
    method: 'POST',
    path: '/v1/auth/register',
    controller: 'AuthController@register',
    auth: false,
    frontendCallers: [C_AUTH],
  },
  {
    method: 'POST',
    path: '/v1/auth/login',
    controller: 'AuthController@login',
    auth: false,
    frontendCallers: [C_AUTH],
  },
  {
    method: 'POST',
    path: '/v1/auth/logout',
    controller: 'AuthController@logout',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/auth/tokens',
    controller: 'AuthController@tokens',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/auth/tokens',
    controller: 'AuthController@createToken',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'DELETE',
    path: '/v1/auth/tokens/{tokenId}',
    controller: 'AuthController@revokeToken',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/auth/email/verify/{token}',
    controller: 'EmailVerificationController@verify',
    auth: false,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/auth/email/resend',
    controller: 'EmailVerificationController@resend',
    auth: true,
    frontendCallers: [],
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/users/me',
    controller: 'UserController@me',
    auth: true,
    frontendCallers: [C_USER, C_PROFILE],
  },
  {
    method: 'PATCH',
    path: '/v1/users/me',
    controller: 'UserController@update',
    auth: true,
    frontendCallers: [C_PROFILE],
  },
  {
    method: 'GET',
    path: '/v1/users/me/identities',
    controller: 'UserIdentityController@index',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/users/me/identities',
    controller: 'UserIdentityController@link',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'DELETE',
    path: '/v1/users/me/identities/{profile}',
    controller: 'UserIdentityController@unlink',
    auth: true,
    frontendCallers: [],
  },

  // ── Google / Calendar ─────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/google/oauth/callback',
    controller: 'GoogleCalendarController@callback',
    auth: false,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/google/oauth',
    controller: 'GoogleCalendarController@attach',
    auth: true,
    frontendCallers: [C_CALENDAR],
  },

  // ── Calendar Events ───────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/calendar-events',
    controller: 'CalendarEventController@index',
    auth: true,
    frontendCallers: [C_CALENDAR_EVENTS],
  },
  {
    method: 'GET',
    path: '/v1/calendar-events/{calendarEvent}',
    controller: 'CalendarEventController@show',
    auth: true,
    frontendCallers: [C_CALENDAR_EVENTS],
  },
  {
    method: 'POST',
    path: '/v1/calendar-events/{calendarEvent}/bot/require',
    controller: 'BotController@require',
    auth: true,
    frontendCallers: [C_CALENDAR_EVENTS],
  },
  {
    method: 'GET',
    path: '/v1/calendar-events/{calendarEvent}/participants',
    controller: 'ParticipantController@index',
    auth: true,
    frontendCallers: [C_PARTICIPANTS],
  },
  {
    method: 'POST',
    path: '/v1/calendar-events/{calendarEvent}/participants/{participant}/set-profile',
    controller: 'ParticipantController@setProfile',
    auth: true,
    frontendCallers: [C_PARTICIPANTS],
  },
  {
    method: 'GET',
    path: '/v1/calendar-events/{calendarEvent}/profiles',
    controller: 'ProfileController@index',
    auth: true,
    frontendCallers: [C_PARTICIPANTS],
  },
  {
    method: 'GET',
    path: '/v1/calendar-events/{calendarEvent}/transcript',
    controller: 'TranscriptController@index',
    auth: true,
    frontendCallers: [C_TRANSCRIPT],
  },
  {
    method: 'GET',
    path: '/v1/calendar-events/{calendarEvent}/followup',
    controller: 'FollowupController@eventShow',
    auth: true,
    frontendCallers: [C_CALENDAR_EVENTS, C_TEAM],
  },
  {
    method: 'POST',
    path: '/v1/calendar-events/{calendarEvent}/followups/generate',
    controller: 'FollowupController@generate',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/calendar-events/{calendarEvent}/meeting-summary',
    controller: 'MeetingSummaryController@show',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/calendar-events/{calendarEvent}/meeting-summary/generate',
    controller: 'MeetingSummaryController@generate',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/calendar-events/{calendarEvent}/meeting-review',
    controller: 'MeetingReviewController@show',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/calendar-events/{calendarEvent}/meeting-review/generate',
    controller: 'MeetingReviewController@generate',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/calendar-events/{calendarEvent}/tasks',
    controller: 'MeetingTaskController@index',
    auth: true,
    frontendCallers: [C_CALENDAR_EVENTS],
  },
  {
    method: 'POST',
    path: '/v1/calendar-events/{calendarEvent}/tasks/generate',
    controller: 'MeetingTaskController@generate',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/calendar-events/{calendarEvent}/agendas',
    controller: 'AgendaController@index',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/calendar-events/{calendarEvent}/agendas/{agenda}',
    controller: 'AgendaController@show',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/calendar-events/{calendarEvent}/agendas/generate',
    controller: 'AgendaController@generate',
    auth: true,
    frontendCallers: [],
  },

  // ── Me / Agenda / Tasks ───────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/me/agendas',
    controller: 'AgendaController@myAgendas',
    auth: true,
    frontendCallers: [C_AGENDAS],
  },
  {
    method: 'GET',
    path: '/v1/me/upcoming-agenda',
    controller: 'UpcomingAgendaController@show',
    auth: true,
    frontendCallers: [C_UPCOMING_AGENDA],
  },
  {
    method: 'GET',
    path: '/v1/me/latest-tasks',
    controller: 'UpcomingAgendaController@latestTasks',
    auth: true,
    frontendCallers: [C_UPCOMING_AGENDA],
  },

  // ── Follow-ups ────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/teams/{team}/followups',
    controller: 'FollowupController@index',
    auth: true,
    frontendCallers: [C_TEAM],
  },
  {
    method: 'GET',
    path: '/v1/followups/{followup}',
    controller: 'FollowupController@show',
    auth: true,
    frontendCallers: [C_FOLLOW_UP],
  },
  {
    method: 'POST',
    path: '/v1/followups/{followup}/regenerate',
    controller: 'FollowupController@regenerate',
    auth: true,
    frontendCallers: [C_FOLLOW_UP],
  },
  {
    method: 'GET',
    path: '/v1/followups/{followup}/export',
    controller: 'FollowupExportController@export',
    auth: true,
    frontendCallers: [],
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/tasks/{task}',
    controller: 'MeetingTaskController@show',
    auth: true,
    frontendCallers: [],
  },

  // ── Persons ───────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/persons',
    controller: 'PersonController@index',
    auth: true,
    frontendCallers: [C_ISSUES],
  },

  // ── Issues ────────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/issues',
    controller: 'IssueController@index',
    auth: true,
    frontendCallers: [C_ISSUES, C_KANBAN],
  },
  {
    method: 'POST',
    path: '/v1/issues',
    controller: 'IssueController@store',
    auth: true,
    frontendCallers: [C_ISSUES],
  },
  {
    method: 'GET',
    path: '/v1/issues/{issue}',
    controller: 'IssueController@show',
    auth: true,
    frontendCallers: [C_ISSUES, C_KANBAN],
  },
  {
    method: 'PATCH',
    path: '/v1/issues/{issue}',
    controller: 'IssueController@update',
    auth: true,
    frontendCallers: [C_ISSUES],
  },
  {
    method: 'DELETE',
    path: '/v1/issues/{issue}',
    controller: 'IssueController@destroy',
    auth: true,
    frontendCallers: [C_ISSUES],
  },
  {
    method: 'POST',
    path: '/v1/issues/{issue}/dispatch',
    controller: 'IssueController@dispatch',
    auth: true,
    frontendCallers: [C_ISSUES],
  },
  {
    method: 'GET',
    path: '/v1/issues/{issue}/attachments',
    controller: 'IssueAttachmentController@index',
    auth: true,
    frontendCallers: [C_ISSUES],
  },
  {
    method: 'POST',
    path: '/v1/issues/{issue}/attachments',
    controller: 'IssueAttachmentController@store',
    auth: true,
    frontendCallers: [C_ISSUES],
  },
  {
    method: 'DELETE',
    path: '/v1/attachments/{attachment}',
    controller: 'IssueAttachmentController@destroy',
    auth: true,
    frontendCallers: [C_ISSUES],
  },
  {
    method: 'GET',
    path: '/v1/attachments/{attachment}/download',
    controller: 'IssueAttachmentController@download',
    auth: false,
    frontendCallers: [],
  },

  // ── Organizations ─────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/organizations',
    controller: 'OrganizationController@index',
    auth: true,
    frontendCallers: [C_ORGANIZATION],
  },
  {
    method: 'POST',
    path: '/v1/organizations',
    controller: 'OrganizationController@store',
    auth: true,
    frontendCallers: [C_ORGANIZATION],
  },
  {
    method: 'GET',
    path: '/v1/organizations/{organization}',
    controller: 'OrganizationController@show',
    auth: true,
    frontendCallers: [C_ORGANIZATION],
  },
  {
    method: 'PATCH',
    path: '/v1/organizations/{organization}',
    controller: 'OrganizationController@update',
    auth: true,
    frontendCallers: [C_ORGANIZATION],
  },
  {
    method: 'DELETE',
    path: '/v1/organizations/{organization}',
    controller: 'OrganizationController@destroy',
    auth: true,
    frontendCallers: [C_ORGANIZATION],
  },

  // ── Teams ─────────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/organizations/{organization}/teams',
    controller: 'TeamController@index',
    auth: true,
    frontendCallers: [C_TEAM],
  },
  {
    method: 'POST',
    path: '/v1/teams',
    controller: 'TeamController@store',
    auth: true,
    frontendCallers: [C_TEAM],
  },
  {
    method: 'GET',
    path: '/v1/teams/{team}',
    controller: 'TeamController@show',
    auth: true,
    frontendCallers: [C_TEAM],
  },
  {
    method: 'PATCH',
    path: '/v1/teams/{team}',
    controller: 'TeamController@update',
    auth: true,
    frontendCallers: [C_TEAM],
  },
  {
    method: 'DELETE',
    path: '/v1/teams/{team}',
    controller: 'TeamController@destroy',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/teams/{team}/methodologies/active',
    controller: 'TeamController@activeMethodology',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/methodologies/assign',
    controller: 'TeamController@assignMethodologyForTeam',
    auth: true,
    frontendCallers: [],
  },

  // ── Team Users ────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/teams/{team}/users',
    controller: 'TeamUserController@index',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/teams/{team}/users/{user}',
    controller: 'TeamUserController@show',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/teams/{team}/users/{user}/kick',
    controller: 'TeamUserController@kick',
    auth: true,
    frontendCallers: [],
  },

  // ── Team Invites ──────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/invites/accept/{token}',
    controller: 'TeamInviteController@accept',
    auth: false,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/teams/{team}/invites',
    controller: 'TeamInviteController@index',
    auth: true,
    frontendCallers: [C_TEAM],
  },
  {
    method: 'POST',
    path: '/v1/teams/{team}/invites',
    controller: 'TeamInviteController@store',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'DELETE',
    path: '/v1/teams/{team}/invites/{invite}',
    controller: 'TeamInviteController@destroy',
    auth: true,
    frontendCallers: [],
  },

  // ── Team Notification Settings ────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/teams/{team}/notification-settings',
    controller: 'TeamNotificationSettingController@index',
    auth: true,
    frontendCallers: [C_NOTIFICATION_SETTINGS],
  },
  {
    method: 'POST',
    path: '/v1/teams/{team}/notification-settings',
    controller: 'TeamNotificationSettingController@store',
    auth: true,
    frontendCallers: [C_NOTIFICATION_SETTINGS],
  },
  {
    method: 'PATCH',
    path: '/v1/teams/{team}/notification-settings/{setting}',
    controller: 'TeamNotificationSettingController@update',
    auth: true,
    frontendCallers: [C_NOTIFICATION_SETTINGS],
  },
  {
    method: 'DELETE',
    path: '/v1/teams/{team}/notification-settings/{setting}',
    controller: 'TeamNotificationSettingController@destroy',
    auth: true,
    frontendCallers: [C_NOTIFICATION_SETTINGS],
  },

  // ── Methodologies ─────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/organizations/{organization}/methodologies',
    controller: 'MethodologyController@index',
    auth: true,
    frontendCallers: [C_METHODOLOGY],
  },
  {
    method: 'POST',
    path: '/v1/methodologies',
    controller: 'MethodologyController@store',
    auth: true,
    frontendCallers: [C_METHODOLOGY],
  },
  {
    method: 'GET',
    path: '/v1/methodologies/{methodology}',
    controller: 'MethodologyController@show',
    auth: true,
    frontendCallers: [C_METHODOLOGY],
  },
  {
    method: 'PATCH',
    path: '/v1/methodologies/{methodology}',
    controller: 'MethodologyController@update',
    auth: true,
    frontendCallers: [C_METHODOLOGY],
  },
  {
    method: 'DELETE',
    path: '/v1/methodologies/{methodology}',
    controller: 'MethodologyController@destroy',
    auth: true,
    frontendCallers: [C_METHODOLOGY],
  },
  {
    method: 'GET',
    path: '/v1/methodologies/{methodology}/chat',
    controller: 'MethodologyController@chat',
    auth: true,
    frontendCallers: [C_METHODOLOGY_CHAT],
  },

  // ── Sources ───────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/sources',
    controller: 'SourceController@index',
    auth: true,
    frontendCallers: [C_SOURCE],
  },
  {
    method: 'DELETE',
    path: '/v1/sources/{source}',
    controller: 'SourceController@destroy',
    auth: true,
    frontendCallers: [C_SOURCE],
  },

  // ── Chats ─────────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/chats',
    controller: 'ChatController@index',
    auth: true,
    frontendCallers: [C_CHATS],
  },
  {
    method: 'POST',
    path: '/v1/chats',
    controller: 'ChatController@store',
    auth: true,
    frontendCallers: [C_CHATS],
  },
  {
    method: 'GET',
    path: '/v1/chats/{chat}',
    controller: 'ChatController@show',
    auth: true,
    frontendCallers: [C_CHATS],
  },
  {
    method: 'PATCH',
    path: '/v1/chats/{chat}',
    controller: 'ChatController@update',
    auth: true,
    frontendCallers: [C_CHATS],
  },
  {
    method: 'DELETE',
    path: '/v1/chats/{chat}',
    controller: 'ChatController@destroy',
    auth: true,
    frontendCallers: [C_CHATS],
  },
  {
    method: 'GET',
    path: '/v1/chats/{chat}/messages',
    controller: 'ChatMessageController@index',
    auth: true,
    frontendCallers: [C_MESSAGES],
  },
  {
    method: 'POST',
    path: '/v1/chats/{chat}/messages',
    controller: 'ChatMessageController@store',
    auth: true,
    frontendCallers: [C_MESSAGES],
  },
  {
    method: 'GET',
    path: '/v1/chats/{chat}/runs/{runUuid}',
    controller: 'ChatMessageController@showRunStatus',
    auth: true,
    frontendCallers: [C_MESSAGES],
  },
  {
    method: 'GET',
    path: '/v1/chats/{chat}/artifacts',
    controller: 'ChatArtifactController@index',
    auth: true,
    frontendCallers: [],
  },

  // ── Telegram ──────────────────────────────────────────────────────────────
  {
    method: 'POST',
    path: '/v1/telegram/webhook',
    controller: 'TelegramBotController@webhook',
    auth: false,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/telegram/chats',
    controller: 'TelegramChatRegistrationController@index',
    auth: true,
    frontendCallers: [C_TELEGRAM],
  },
  {
    method: 'POST',
    path: '/v1/telegram/chats/{telegramChat}/attach-code',
    controller: 'TelegramChatRegistrationController@issueAttachCode',
    auth: true,
    frontendCallers: [C_TELEGRAM],
  },

  // ── Agent Activity ────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/agent-activity',
    controller: 'AgentActivityLogController@index',
    auth: true,
    frontendCallers: [C_ACTIVITY],
  },

  // ── Agent Profiles ────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/agent-profiles',
    controller: 'AgentProfileController@index',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'POST',
    path: '/v1/agent-profiles',
    controller: 'AgentProfileController@store',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'GET',
    path: '/v1/agent-profiles/{agentProfile}',
    controller: 'AgentProfileController@show',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'PATCH',
    path: '/v1/agent-profiles/{agentProfile}',
    controller: 'AgentProfileController@update',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'DELETE',
    path: '/v1/agent-profiles/{agentProfile}',
    controller: 'AgentProfileController@destroy',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'POST',
    path: '/v1/agent-profiles/{agentProfile}/validate-payload',
    controller: 'AgentProfileController@validatePayload',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'GET',
    path: '/v1/agent-profiles/{agentProfile}/memories',
    controller: 'AgentMemoryController@profileIndex',
    auth: true,
    frontendCallers: [],
  },

  // ── Agent Tasks ───────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/agent-tasks',
    controller: 'AgentTaskController@index',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'POST',
    path: '/v1/agent-tasks',
    controller: 'AgentTaskController@store',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'GET',
    path: '/v1/agent-tasks/meta',
    controller: 'AgentTaskController@meta',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'GET',
    path: '/v1/agent-tasks/{agentTask}',
    controller: 'AgentTaskController@show',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'PATCH',
    path: '/v1/agent-tasks/{agentTask}',
    controller: 'AgentTaskController@update',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'DELETE',
    path: '/v1/agent-tasks/{agentTask}',
    controller: 'AgentTaskController@destroy',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'GET',
    path: '/v1/agent-tasks/{agentTask}/runs',
    controller: 'AgentTaskController@runs',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'GET',
    path: '/v1/agent-tasks/{agentTask}/runs/{run}',
    controller: 'AgentTaskController@showRun',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'POST',
    path: '/v1/agent-tasks/{agentTask}/dispatch',
    controller: 'AgentTaskController@dispatch',
    auth: true,
    frontendCallers: [C_AGENTS],
  },
  {
    method: 'GET',
    path: '/v1/agent-tasks/{agentTask}/memories',
    controller: 'AgentMemoryController@taskIndex',
    auth: true,
    frontendCallers: [],
  },

  // ── Agent Tools ───────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/agent-tools',
    controller: 'AgentToolController@index',
    auth: true,
    frontendCallers: [C_AGENTS],
  },

  // ── Agent Memories ────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/agent-memories',
    controller: 'AgentMemoryController@index',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/agent-memories/{agentMemory}',
    controller: 'AgentMemoryController@show',
    auth: true,
    frontendCallers: [],
  },

  // ── Workspaces ────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/workspaces',
    controller: 'WorkspaceController@index',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/workspaces',
    controller: 'WorkspaceController@store',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/workspaces/{workspace}',
    controller: 'WorkspaceController@show',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'PATCH',
    path: '/v1/workspaces/{workspace}',
    controller: 'WorkspaceController@update',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'DELETE',
    path: '/v1/workspaces/{workspace}',
    controller: 'WorkspaceController@destroy',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/workspaces/{workspace}/contents',
    controller: 'WorkspaceController@contents',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/workspaces/{workspace}/file',
    controller: 'WorkspaceController@readFile',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'PUT',
    path: '/v1/workspaces/{workspace}/file',
    controller: 'WorkspaceController@writeFile',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'DELETE',
    path: '/v1/workspaces/{workspace}/file',
    controller: 'WorkspaceController@deleteFile',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/workspaces/{workspace}/directories',
    controller: 'WorkspaceController@createDirectory',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/workspaces/{workspace}/permissions',
    controller: 'WorkspaceController@storePermission',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'DELETE',
    path: '/v1/workspaces/{workspace}/permissions/{permission}',
    controller: 'WorkspaceController@destroyPermission',
    auth: true,
    frontendCallers: [],
  },

  // ── Dashboard / Summary ───────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/dashboard',
    controller: 'DashboardController@index',
    auth: true,
    frontendCallers: [C_SUMMARY],
  },

  // ── Demo ──────────────────────────────────────────────────────────────────
  {
    method: 'POST',
    path: '/v1/demo/seed',
    controller: 'DemoController@seed',
    auth: true,
    frontendCallers: [C_DEMO_SEED],
  },
  {
    method: 'GET',
    path: '/v1/demo/status',
    controller: 'DemoController@status',
    auth: true,
    frontendCallers: [C_DEMO_STATUS],
  },
  {
    method: 'DELETE',
    path: '/v1/demo',
    controller: 'DemoController@destroy',
    auth: true,
    frontendCallers: [C_DEMO_DELETE],
  },

  // ── Insight ───────────────────────────────────────────────────────────────
  {
    method: 'GET',
    path: '/v1/insight/profiles/{profile}',
    controller: 'InsightController@profile',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'DELETE',
    path: '/v1/insight/profiles/{profile}',
    controller: 'InsightController@forget',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/insight/profiles/{profile}/short-term',
    controller: 'InsightController@shortTerm',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/insight/profiles/{profile}/items',
    controller: 'InsightController@items',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/insight/profiles/{profile}/sources',
    controller: 'InsightController@sources',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/insight/profiles/{profile}/history',
    controller: 'InsightController@history',
    auth: true,
    frontendCallers: [],
  },
  {
    method: 'GET',
    path: '/v1/insight/relationships',
    controller: 'InsightController@relationship',
    auth: true,
    frontendCallers: [],
  },

  // ── Internal / Webhooks ───────────────────────────────────────────────────
  {
    method: 'POST',
    path: '/v1/recall/webhook',
    controller: 'RecallWebhookController@webhook',
    auth: false,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/internal/agent-task-runs/{run}/tool-calls',
    controller: 'SandboxToolGatewayController@store',
    auth: false,
    frontendCallers: [],
  },
  {
    method: 'POST',
    path: '/v1/internal/agent-task-runs/{run}/llm-completions',
    controller: 'SandboxToolGatewayController@complete',
    auth: false,
    frontendCallers: [],
  },

  // ── MCP Server (ai.php) ───────────────────────────────────────────────────
  {
    method: 'POST',
    path: '/mcp',
    controller: 'HrServer (MCP)',
    auth: true,
    frontendCallers: [],
  },
];

/** Derive the feature domain from a caller path, e.g. "features/agents/api/agents.ts" → "agents" */
export function callerFeature(callerPath: string): string {
  const match = /features\/([^/]+)\//.exec(callerPath);

  return match ? match[1] : 'other';
}

/** All unique feature domains that have at least one caller */
export function getFeatureDomains(): string[] {
  const domains = new Set<string>();

  for (const endpoint of API_REGISTRY) {
    for (const caller of endpoint.frontendCallers) {
      domains.add(callerFeature(caller));
    }
  }

  return [...domains].toSorted();
}
