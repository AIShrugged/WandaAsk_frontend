import { render, screen } from '@testing-library/react';

import { RecentChats } from '@/features/dashboard/ui/RecentChats';

import type { Chat } from '@/features/chat/types';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const makeChat = (id: number, title: string | null = null): Chat => ({
  id,
  title,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-06-15T10:00:00.000Z',
});

describe('RecentChats', () => {
  it('renders empty state when no chats', () => {
    render(<RecentChats chats={[]} />);
    expect(screen.getByText(/no chats yet/i)).toBeInTheDocument();
  });

  it('renders chat titles', () => {
    render(
      <RecentChats
        chats={[makeChat(1, 'Project review'), makeChat(2, 'Q2 planning')]}
      />,
    );
    expect(screen.getByText('Project review')).toBeInTheDocument();
    expect(screen.getByText('Q2 planning')).toBeInTheDocument();
  });

  it('shows "Untitled chat" for chats without title', () => {
    render(<RecentChats chats={[makeChat(1, null)]} />);
    expect(screen.getByText('Untitled chat')).toBeInTheDocument();
  });

  it('renders links for each chat', () => {
    render(
      <RecentChats chats={[makeChat(5, 'Chat A'), makeChat(6, 'Chat B')]} />,
    );
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('5'));
    expect(links[1]).toHaveAttribute('href', expect.stringContaining('6'));
  });

  it('renders relative time for each chat', () => {
    render(<RecentChats chats={[makeChat(1, 'Chat')]} />);
    // formatDistanceToNow produces "ago" text
    expect(screen.getByText(/ago/i)).toBeInTheDocument();
  });
});
