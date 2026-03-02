'use client';

import { useState } from 'react';

import { ArtifactPanel } from '@/features/chat/ui/artifact-panel';
import { ChatList } from '@/features/chat/ui/chat-list';
import { ChatWindow } from '@/features/chat/ui/chat-window';
import { CollapsedSidePanel } from '@/shared/ui/layout/collapsed-side-panel';

import type { ArtifactsResponse, Chat, Message } from '@/features/chat/types';

interface ChatLayoutProps {
  initialChats: Chat[];
  totalCount: number;
  activeChatId?: number;
  chatId: number;
  initialArtifacts: ArtifactsResponse | null;
  initialMessages: Message[];
  totalMessagesCount: number;
  startOffset: number;
}

export function ChatLayout({
  initialChats,
  totalCount,
  activeChatId,
  chatId,
  initialArtifacts,
  initialMessages,
  totalMessagesCount,
  startOffset,
}: ChatLayoutProps) {
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  return (
    <div className='flex h-full rounded-[var(--radius-card)] overflow-hidden border border-border bg-card shadow-card'>
      <ChatList
        initialChats={initialChats}
        totalCount={totalCount}
        activeChatId={activeChatId}
      />

      <ArtifactPanel
        chatId={chatId}
        initialArtifacts={initialArtifacts}
      />

      {isChatCollapsed ? (
        <CollapsedSidePanel
          label='Chat'
          icon='left'
          onExpand={() => setIsChatCollapsed(false)}
          className=''
        />
      ) : (
        <div className='flex-1 min-w-0 flex flex-col'>
          <ChatWindow
            chatId={chatId}
            initialMessages={initialMessages}
            totalCount={totalMessagesCount}
            startOffset={startOffset}
            onCollapse={() => setIsChatCollapsed(true)}
          />
        </div>
      )}
    </div>
  );
}
