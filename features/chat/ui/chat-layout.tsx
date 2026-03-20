'use client';

import { useState } from 'react';

import { ArtifactPanel } from '@/features/chat/ui/artifact-panel';
import { ChatList } from '@/features/chat/ui/chat-list';
import { ChatWindow } from '@/features/chat/ui/chat-window';
import { CollapsedSidePanel } from '@/shared/ui/layout/collapsed-side-panel';

import type { OrganizationProps } from '@/entities/organization';
import type { ArtifactsResponse, Chat, Message } from '@/features/chat/types';

interface ChatLayoutProps {
  initialChats: Chat[];
  totalCount: number;
  activeChatId?: number;
  currentChat?: Chat;
  chatId: number;
  initialArtifacts: ArtifactsResponse | null;
  initialMessages: Message[];
  totalMessagesCount: number;
  startOffset: number;
  organizations?: OrganizationProps[];
}

/**
 * ChatLayout component.
 * @param root0 - Component props.
 * @param root0.initialChats - Initial list of chats.
 * @param root0.totalCount - Total number of chats.
 * @param root0.activeChatId - ID of the currently active chat.
 * @param root0.currentChat
 * @param root0.chatId - ID of the chat to display in the window.
 * @param root0.initialArtifacts - Pre-loaded artifacts for the chat.
 * @param root0.initialMessages - Pre-loaded messages for the chat.
 * @param root0.totalMessagesCount - Total message count in the chat.
 * @param root0.startOffset - Offset from which initialMessages were loaded.
 * @param root0.organizations
 * @returns Result.
 */
export function ChatLayout({
  initialChats,
  totalCount,
  activeChatId,
  currentChat,
  chatId,
  initialArtifacts,
  initialMessages,
  totalMessagesCount,
  startOffset,
  organizations = [],
}: ChatLayoutProps) {
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  const [chat, setChat] = useState<Chat>(
    currentChat ?? {
      id: chatId,
      title: null,
      organization_id: null,
      team_id: null,
      created_at: '',
      updated_at: '',
    },
  );

  return (
    <div className='flex h-full rounded-[var(--radius-card)] overflow-hidden border border-border bg-card shadow-card'>
      {/* Chat list — hidden on mobile, slide in at md+ */}
      <div className='hidden md:flex flex-col h-full'>
        <ChatList
          initialChats={initialChats}
          totalCount={totalCount}
          activeChatId={activeChatId}
          organizations={organizations}
          onActiveChatUpdate={setChat}
        />
      </div>

      {/* Artifact panel — desktop only */}
      <div className='hidden lg:flex flex-col h-full'>
        <ArtifactPanel chatId={chatId} initialArtifacts={initialArtifacts} />
      </div>

      {isChatCollapsed ? (
        <CollapsedSidePanel
          label='Chat'
          onExpand={() => {
            return setIsChatCollapsed(false);
          }}
        />
      ) : (
        <div className='flex-1 min-w-0 flex flex-col'>
          <ChatWindow
            chat={chat}
            chatId={chatId}
            initialMessages={initialMessages}
            totalCount={totalMessagesCount}
            startOffset={startOffset}
            onCollapse={() => {
              return setIsChatCollapsed(true);
            }}
          />
        </div>
      )}
    </div>
  );
}
