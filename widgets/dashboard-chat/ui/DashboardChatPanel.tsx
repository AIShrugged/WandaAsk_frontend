'use client';

import { MessageSquare, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { AgentActivityFeed } from '@/features/agents/ui/agent-activity-feed';
import { AgentTasksFeed } from '@/features/agents/ui/agent-tasks-feed';
import { createChat } from '@/features/chat/api/chats';
import { ChatWindow } from '@/features/chat/ui/chat-window';

import type { OrganizationProps } from '@/entities/organization';
import type {
  AgentActivityItem,
  AgentTask,
} from '@/features/agents/model/types';
import type { Chat, Message } from '@/features/chat/types';

interface DashboardChatPanelProps {
  initialChat: Chat | null;
  initialMessages: Message[];
  totalMessagesCount: number;
  startOffset: number;
  organizations: OrganizationProps[];
  initialActivityItems: AgentActivityItem[];
  activityTotalCount: number;
  initialTaskItems: AgentTask[];
  tasksTotalCount: number;
}

const TABS = ['chat', 'activity', 'tasks'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  chat: 'Chat',
  activity: 'Activity',
  tasks: 'Tasks',
};

/**
 * DashboardChatPanel — sidebar chat panel for the main dashboard layout.
 * Shows only the active chat window (first chat by default).
 * @param root0 - Component props.
 * @param root0.initialChat - The chat to display initially.
 * @param root0.initialMessages - Pre-loaded messages for the initial chat.
 * @param root0.totalMessagesCount - Total message count.
 * @param root0.startOffset - Offset from which initialMessages were loaded.
 * @param root0.organizations - Available organizations.
 * @param root0.initialActivityItems - Pre-loaded activity items.
 * @param root0.activityTotalCount - Total activity count.
 * @param root0.initialTaskItems - Pre-loaded agent task items.
 * @param root0.tasksTotalCount - Total tasks count.
 * @returns JSX element.
 */
export function DashboardChatPanel({
  initialChat,
  initialMessages,
  totalMessagesCount,
  startOffset,
  initialActivityItems,
  activityTotalCount,
  initialTaskItems,
  tasksTotalCount,
}: DashboardChatPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [activeChat, setActiveChat] = useState<Chat | null>(initialChat);
  const [activeChatMessages, setActiveChatMessages] =
    useState<Message[]>(initialMessages);
  const [activeChatTotal, setActiveChatTotal] = useState(totalMessagesCount);
  const [activeChatOffset, setActiveChatOffset] = useState(startOffset);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateChat = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const result = await createChat(null);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      setActiveChat(result);
      setActiveChatMessages([]);
      setActiveChatTotal(0);
      setActiveChatOffset(0);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className='flex h-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-card'>
      <div className='flex flex-1 min-w-0 flex-col min-h-0'>
        <div className='flex flex-shrink-0 gap-1 border-b border-border px-3 pt-2'>
          {TABS.map((tab) => {
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                }}
                className={[
                  'cursor-pointer px-4 py-2 text-sm font-medium capitalize transition-colors',
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {TAB_LABELS[tab]}
              </button>
            );
          })}
        </div>

        {activeTab === 'chat' &&
          (activeChat ? (
            <ChatWindow
              chat={activeChat}
              chatId={activeChat.id}
              initialMessages={activeChatMessages}
              totalCount={activeChatTotal}
              startOffset={activeChatOffset}
            />
          ) : (
            <div className='flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground'>
              <MessageSquare className='w-10 h-10 text-muted-foreground/30' />
              <p className='text-sm text-center px-4'>No chats yet</p>
              <button
                onClick={handleCreateChat}
                disabled={isCreating}
                className='flex items-center gap-1 text-xs text-primary hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-40'
              >
                <Plus className='w-3 h-3' />
                New chat
              </button>
            </div>
          ))}

        {activeTab === 'activity' && (
          <div className='flex-1 overflow-y-auto p-3'>
            <AgentActivityFeed
              initialItems={initialActivityItems}
              totalCount={activityTotalCount}
            />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className='flex-1 overflow-y-auto p-3'>
            <AgentTasksFeed
              initialItems={initialTaskItems}
              totalCount={tasksTotalCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
