import { beforeAll } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatList } from '@/features/chat/ui/chat-list';

import type { Chat } from '@/features/chat/types';

// jsdom doesn't implement IntersectionObserver — provide a no-op stub
beforeAll(() => {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/features/chat/api/chats', () => ({
  createChat: jest.fn(() =>
    Promise.resolve({ id: 99, title: null, created_at: '', updated_at: '' }),
  ),
  getChats: jest.fn(() => Promise.resolve({ chats: [], totalCount: 0 })),
}));

jest.mock('sonner', () => ({
  toast: { error: jest.fn() },
}));

// Simplify ChatListItem to avoid nested dependencies
jest.mock('@/features/chat/ui/chat-list-item', () => ({
  ChatListItem: ({ chat }: { chat: Chat }) => (
    <div data-testid={`chat-item-${chat.id}`}>
      {chat.title ?? 'Untitled chat'}
    </div>
  ),
}));

const makeChat = (id: number, title: string | null = null): Chat => ({
  id,
  title,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
});

describe('ChatList', () => {
  it('renders a list of initial chats', () => {
    const chats = [makeChat(1, 'First chat'), makeChat(2, 'Second chat')];
    render(<ChatList initialChats={chats} totalCount={2} />);
    expect(screen.getByTestId('chat-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('chat-item-2')).toBeInTheDocument();
  });

  it('renders the empty state when initialChats is empty', () => {
    render(<ChatList initialChats={[]} totalCount={0} />);
    expect(screen.getByText(/no chats yet/i)).toBeInTheDocument();
  });

  it('renders a "New" button', () => {
    render(<ChatList initialChats={[]} totalCount={0} />);
    expect(
      screen.getByRole('button', { name: /new chat/i }),
    ).toBeInTheDocument();
  });

  it('collapses the panel when the ChevronLeft button is clicked', async () => {
    render(<ChatList initialChats={[makeChat(1, 'Chat')]} totalCount={1} />);
    await userEvent.click(
      screen.getByRole('button', { name: /collapse chats panel/i }),
    );
    // After collapse the list should no longer be visible
    expect(screen.queryByTestId('chat-item-1')).not.toBeInTheDocument();
  });

  it('expands the panel again after collapsing', async () => {
    render(<ChatList initialChats={[makeChat(1, 'Chat')]} totalCount={1} />);

    await userEvent.click(
      screen.getByRole('button', { name: /collapse chats panel/i }),
    );
    // Collapsed — the CollapsedSidePanel expand button appears
    await userEvent.click(
      screen.getByRole('button', { name: /expand chats panel/i }),
    );
    expect(screen.getByTestId('chat-item-1')).toBeInTheDocument();
  });
});
