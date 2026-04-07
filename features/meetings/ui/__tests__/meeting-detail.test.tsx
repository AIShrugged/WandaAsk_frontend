import { render, screen } from '@testing-library/react';

import { MeetingDetail } from '@/features/meetings/ui/meeting-detail';

import type { AnchorHTMLAttributes, ReactNode } from 'react';

const EVENT_API_MODULE = '@/features/event/api/calendar-events';

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
      ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement> & {
      children: ReactNode;
      href: string;
    }) => {
      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    },
  };
});

jest.mock('@/features/event/api/calendar-events', () => {
  return {
    getCalendarEventDetail: jest.fn(),
    getMeetingTasks: jest.fn(),
  };
});

jest.mock('@/features/meeting/ui/meeting-tasks', () => {
  return {
    __esModule: true,
    default: () => {
      return <div data-testid='meeting-tasks' />;
    },
  };
});

describe('MeetingDetail', () => {
  it('renders agenda content, type, and status from the detail response', async () => {
    const { getCalendarEventDetail, getMeetingTasks } =
      jest.requireMock(EVENT_API_MODULE);

    getCalendarEventDetail.mockResolvedValueOnce({
      data: {
        event: {
          id: 175,
          platform: 'google_meet',
          url: 'https://meet.google.com/ukb-cmhd-jqr',
          title: 'Wanda: техсинк',
          description: '',
          starts_at: '2026-04-02T09:00:00.000000Z',
          ends_at: '2026-04-02T09:30:00.000000Z',
        },
        participants: [],
        agendas: [
          {
            id: 8,
            type: 'general',
            status: 'done',
            content:
              '📋 Общая агенда митинга\n\n🔙 Прошлый митинг:\nНа предыдущей встрече мы обсудили архитектуру рабочих процессов.',
            user_id: null,
            sent_at: '2026-04-02T08:30:01.000000Z',
            send_scheduled_at: '2026-04-02T08:30:00.000000Z',
          },
        ],
        tasks: [],
        summary: null,
        review: null,
        followup: null,
        previous_meeting: null,
        key_takeaways: [],
        counts: {},
      },
    });
    getMeetingTasks.mockResolvedValueOnce([]);

    render(await MeetingDetail({ id: '175' }));

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText(/Общая агенда митинга/)).toBeInTheDocument();
    expect(screen.getByText(/Прошлый митинг/)).toBeInTheDocument();
    expect(screen.getByTestId('meeting-tasks')).toBeInTheDocument();
  });
});
