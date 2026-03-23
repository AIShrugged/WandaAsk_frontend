'use client';

import { Sparkles } from 'lucide-react';
import { useState } from 'react';

import { ArtifactPanel } from '@/features/chat/ui/artifact-panel';
import { ChatList } from '@/features/chat/ui/chat-list';
import { ChatWindow } from '@/features/chat/ui/chat-window';
import { CollapsedSidePanel } from '@/shared/ui/layout/collapsed-side-panel';

import type { OrganizationProps } from '@/entities/organization';
import type { ArtifactsResponse, Chat, Message } from '@/features/chat/types';

type MobileTab = 'chats' | 'artifacts' | 'chat';

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

  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
  // Default to 'chat' tab so the conversation is the first thing the user sees

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
    <div className='flex flex-col h-full rounded-[var(--radius-card)] overflow-hidden border border-border bg-card shadow-card'>
      {/* ── Mobile tab bar (< lg): Chats | Artifacts | Chat ── */}
      <div className='flex lg:hidden border-b border-border flex-shrink-0'>
        <button
          type='button'
          className={[
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            mobileTab === 'chats'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
          onClick={() => {
            setMobileTab('chats');
          }}
        >
          Chats
        </button>
        <button
          type='button'
          className={[
            'flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
            mobileTab === 'artifacts'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
          onClick={() => {
            setMobileTab('artifacts');
          }}
        >
          <Sparkles className='w-3.5 h-3.5' />
          Artifacts
        </button>
        <button
          type='button'
          className={[
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            mobileTab === 'chat'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
          onClick={() => {
            setMobileTab('chat');
          }}
        >
          Chat
        </button>
      </div>

      {/* ── Main body ────────────────────────────────────────────────── */}
      <div className='flex flex-1 min-h-0'>
        {/* Chat list sidebar — desktop only (lg+); on mobile shown via tab */}
        <div className='hidden lg:flex flex-col h-full'>
          <ChatList
            initialChats={initialChats}
            totalCount={totalCount}
            activeChatId={activeChatId}
            organizations={organizations}
            onActiveChatUpdate={setChat}
          />
        </div>

        {/* ── Mobile/tablet (< lg): one panel at a time via tabs ── */}
        <div className='flex lg:hidden flex-1 min-w-0 flex-col min-h-0'>
          {mobileTab === 'chats' && (
            <ChatList
              initialChats={initialChats}
              totalCount={totalCount}
              activeChatId={activeChatId}
              organizations={organizations}
              onActiveChatUpdate={(updated) => {
                setChat(updated);
                setMobileTab('chat');
              }}
            />
          )}
          {mobileTab === 'artifacts' && (
            <ArtifactPanel
              chatId={chatId}
              initialArtifacts={initialArtifacts}
            />
          )}
          {mobileTab === 'chat' && (
            <ChatWindow
              chat={chat}
              chatId={chatId}
              initialMessages={initialMessages}
              totalCount={totalMessagesCount}
              startOffset={startOffset}
            />
          )}
        </div>

        {/* ── Desktop (lg+): Artifacts then Chat side by side ── */}
        <div className='hidden lg:flex w-72 xl:w-80 flex-shrink-0 flex-col h-full'>
          <ArtifactPanel chatId={chatId} initialArtifacts={initialArtifacts} />
        </div>
        {isChatCollapsed ? (
          <CollapsedSidePanel
            label='Chat'
            icon='right'
            className='hidden lg:flex border-r border-border'
            onExpand={() => {
              setIsChatCollapsed(false);
            }}
          />
        ) : (
          <div className='hidden lg:flex flex-1 min-w-0 flex-col min-h-0'>
            <ChatWindow
              chat={chat}
              chatId={chatId}
              initialMessages={initialMessages}
              totalCount={totalMessagesCount}
              startOffset={startOffset}
              onCollapse={() => {
                setIsChatCollapsed(true);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
