/* eslint-disable jsdoc/require-jsdoc */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatListItem } from '@/features/chat/ui/chat-list-item';

const mockUpdateChatTitle = jest.fn();

const mockDeleteChat = jest.fn();

jest.mock('@/features/chat/api/chats', () => {
  return {
    updateChatTitle: (...args: unknown[]) => {
      return mockUpdateChatTitle(...args);
    },
    deleteChat: (...args: unknown[]) => {
      return mockDeleteChat(...args);
    },
  };
});

jest.mock('sonner', () => {
  return {
    toast: { error: jest.fn(), success: jest.fn() },
  };
});

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
    }: {
      children: React.ReactNode;
      href: string;
    }) => {
      return <a href={href}>{children}</a>;
    },
  };
});

const makeChat = (overrides = {}) => {
  return {
    id: 1,
    title: 'My Chat',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
};

describe('ChatListItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateChatTitle.mockResolvedValue({});
    mockDeleteChat.mockResolvedValue({});
  });

  // ── Idle mode ────────────────────────────────────────────────────────────

  it('renders the chat title as a link in idle mode', () => {
    render(
      <ChatListItem
        chat={makeChat()}
        isActive={false}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByRole('link', { name: 'My Chat' })).toBeInTheDocument();
  });

  it('renders "Untitled chat" when title is null', () => {
    render(
      <ChatListItem
        chat={makeChat({ title: null })}
        isActive={false}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText('Untitled chat')).toBeInTheDocument();
  });

  it('link has correct href', () => {
    render(
      <ChatListItem
        chat={makeChat({ id: 42 })}
        isActive={false}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/dashboard/chat/42',
    );
  });

  it('applies active styles when isActive is true', () => {
    const { container } = render(
      <ChatListItem
        chat={makeChat()}
        isActive={true}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(container.firstChild).toHaveClass('bg-sidebar-accent');
  });

  // ── Edit mode ────────────────────────────────────────────────────────────

  it('switches to editing mode when edit button is clicked', async () => {
    render(
      <ChatListItem
        chat={makeChat()}
        isActive={false}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit title' }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('edit input is pre-filled with current title', async () => {
    render(
      <ChatListItem
        chat={makeChat({ title: 'Old Title' })}
        isActive={false}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit title' }));
    expect(screen.getByRole('textbox')).toHaveValue('Old Title');
  });

  it('cancel button in edit mode returns to idle', async () => {
    render(
      <ChatListItem
        chat={makeChat()}
        isActive={false}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit title' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('pressing Escape cancels editing', async () => {
    render(
      <ChatListItem
        chat={makeChat()}
        isActive={false}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit title' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('calls updateChatTitle and onUpdate on save with new title', async () => {
    const onUpdate = jest.fn();

    render(
      <ChatListItem
        chat={makeChat({ title: 'Old' })}
        isActive={false}
        onUpdate={onUpdate}
        onDelete={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit title' }));
    const input = screen.getByRole('textbox');

    await userEvent.clear(input);
    await userEvent.type(input, 'New Title');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(mockUpdateChatTitle).toHaveBeenCalledWith(1, 'New Title');
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Title' }),
      );
    });
  });

  it('cancels editing without API call when title unchanged', async () => {
    render(
      <ChatListItem
        chat={makeChat({ title: 'Same' })}
        isActive={false}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit title' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(mockUpdateChatTitle).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  // ── Delete confirmation mode ─────────────────────────────────────────────

  it('switches to confirming-delete mode when delete button clicked', async () => {
    render(
      <ChatListItem
        chat={makeChat()}
        isActive={false}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete chat' }));
    expect(screen.getByText('Delete?')).toBeInTheDocument();
  });

  it('cancel delete returns to idle', async () => {
    render(
      <ChatListItem
        chat={makeChat()}
        isActive={false}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete chat' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Cancel delete' }),
    );
    expect(screen.queryByText('Delete?')).not.toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('confirm delete calls deleteChat and onDelete', async () => {
    const onDelete = jest.fn();

    render(
      <ChatListItem
        chat={makeChat({ id: 5 })}
        isActive={false}
        onUpdate={jest.fn()}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete chat' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm delete' }),
    );
    await waitFor(() => {
      expect(mockDeleteChat).toHaveBeenCalledWith(5);
      expect(onDelete).toHaveBeenCalledWith(5);
    });
  });
});
