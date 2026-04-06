'use client';

import { ChevronLeft, MessageSquare } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { pollRun, sendMessage } from '@/features/chat/api/messages';
import { useMessages } from '@/features/chat/hooks/use-messages';
import { ChatInput } from '@/features/chat/ui/chat-input';
import { ChatMessage } from '@/features/chat/ui/chat-message';
import { ChatSuggestions } from '@/features/chat/ui/chat-suggestions';
import { ROUTES } from '@/shared/lib/routes';

import type {
  Chat,
  Message,
  MessageStatus,
  PageContext,
} from '@/features/chat/types';

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 60; // 90 s timeout
const TERMINAL: ReadonlySet<MessageStatus> = new Set(['completed', 'failed']);

interface ChatWindowProps {
  chat?: Chat;
  chatId: number;
  initialMessages: Message[];
  totalCount: number;
  startOffset: number;
  onCollapse?: () => void;
}

/**
 * ChatWindow component.
 * @param root0 - Component props.
 * @param root0.chat
 * @param root0.chatId - The chat ID to load messages for.
 * @param root0.initialMessages - Pre-loaded messages.
 * @param root0.totalCount - Total message count in the chat.
 * @param root0.startOffset - Offset from which initialMessages were loaded.
 * @param root0.onCollapse - Callback to collapse the chat panel.
 * @returns Result.
 */
export function ChatWindow({
  chat: providedChat,
  chatId,
  initialMessages,
  totalCount,
  startOffset,
  onCollapse,
}: ChatWindowProps) {
  const router = useRouter();
  const chat: Chat = providedChat ?? {
    id: chatId,
    title: null,
    organization_id: null,
    team_id: null,
    created_at: '',
    updated_at: '',
  };
  const {
    messages,
    isLoading,
    hasMore,
    sentinelRef,
    containerRef,
    addMessage,
    updateMessage = () => {},
    removeMessage = () => {},
  } = useMessages(chatId, initialMessages, totalCount, startOffset);
  const searchParams = useSearchParams();
  const [composerError, setComposerError] = useState('');
  // True if there's an in-flight run on initial load (e.g. page refresh mid-generation)
  const [isSending, setIsSending] = useState(() => {
    return initialMessages.some((m) => {
      return (
        m.role === 'assistant' &&
        m.agent_run_uuid !== null &&
        !TERMINAL.has(m.status ?? 'failed')
      );
    });
  });
  // Active run being polled — { messageId, runUuid }
  const activeRunRef = useRef<{ messageId: number; runUuid: string } | null>(
    null,
  );
  const pollAttemptsRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [containerRef]);

  /**
   * startPolling — begins polling a run until it reaches a terminal state.
   * @param messageId - The placeholder message ID to update in-place.
   * @param runUuid - The agent run UUID from the queued message.
   * @returns Result.
   */
  const startPolling = (messageId: number, runUuid: string) => {
    activeRunRef.current = { messageId, runUuid };
    pollAttemptsRef.current = 0;
    setIsSending(true);
    schedulePoll();
  };
  /**
   * schedulePoll — schedules the next poll tick.
   * @returns Result.
   */
  const schedulePoll = () => {
    pollTimerRef.current = setTimeout(() => {
      void doPoll();
    }, POLL_INTERVAL_MS);
  };
  /**
   * doPoll — performs a single poll request.
   * @returns Promise.
   */
  // eslint-disable-next-line max-statements
  const doPoll = async () => {
    const run = activeRunRef.current;

    if (!run) return;

    pollAttemptsRef.current += 1;

    if (pollAttemptsRef.current > POLL_MAX_ATTEMPTS) {
      updateMessage(run.messageId, {
        status: 'failed',
        error_message: 'Response timed out. Please try again.',
      });
      activeRunRef.current = null;
      setIsSending(false);

      return;
    }

    try {
      const result = await pollRun(chatId, run.runUuid);

      if (TERMINAL.has(result.status)) {
        updateMessage(run.messageId, {
          status: result.status,
          content: result.message.content,
          error_message: result.error_message,
          failure_code: result.failure_code,
          current_attempt: result.current_attempt,
          max_attempts: result.max_attempts,
          completed_at: result.completed_at,
        });
        activeRunRef.current = null;
        setIsSending(false);
      } else {
        // Non-terminal — update status label and continue polling
        updateMessage(run.messageId, {
          status: result.status,
          current_attempt: result.current_attempt,
          max_attempts: result.max_attempts,
          next_retry_at: result.next_retry_at,
        });
        schedulePoll();
      }
    } catch {
      // Network error — keep polling unless max attempts reached
      schedulePoll();
    }
  };

  // On mount: resume polling timer for any in-flight run (no setState — isSending
  // is already initialised via lazy useState above to avoid set-state-in-effect)
  useEffect(() => {
    const pending = initialMessages.findLast((m) => {
      return (
        m.role === 'assistant' &&
        m.agent_run_uuid !== null &&
        !TERMINAL.has(m.status ?? 'failed')
      );
    });

    if (pending?.agent_run_uuid) {
      activeRunRef.current = {
        messageId: pending.id,
        runUuid: pending.agent_run_uuid,
      };
      pollAttemptsRef.current = 0;
      schedulePoll();
    }

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

      activeRunRef.current = null;
    };
  }, []);

  /**
   * handleSend.
   * @param content - content.
   * @returns Result.
   */
  const handleSend = (content: string) => {
    if (isSending) {
      return;
    }

    const rawHtml = document.documentElement.outerHTML;
    const pageContext: PageContext = {
      page_html: rawHtml.length > 150_000 ? rawHtml.slice(0, 150_000) : rawHtml,
      page_title: document.title,
      page_url: globalThis.location.href,
    };

    const optimisticId = Date.now();
    const optimistic: Message = {
      id: optimisticId,
      chat_id: chatId,
      role: 'user',
      status: null,
      content,
      followup_data: null,
      error_message: null,
      failure_code: null,
      agent_run_uuid: null,
      current_attempt: null,
      max_attempts: null,
      completed_at: null,
      next_retry_at: null,
      created_at: new Date().toISOString(),
    };

    addMessage(optimistic);
    setIsSending(true);
    setComposerError('');

    sendMessage(chatId, content, pageContext)
      .then((result) => {
        const actionResult =
          typeof result === 'object' &&
          result !== null &&
          'error' in result &&
          'data' in result
            ? result
            : { data: result as Message, error: null };

        if (actionResult.error) {
          removeMessage(optimisticId);
          setIsSending(false);

          if (actionResult.fieldErrors?.organization_id) {
            setComposerError(
              'Выберите организацию в верхнем переключателе, чтобы продолжить работу в нужном контексте.',
            );

            return;
          }

          toast.error(actionResult.error);

          return;
        }

        const queuedMessage = actionResult.data;

        if (!queuedMessage) {
          removeMessage(optimisticId);
          setIsSending(false);
          toast.error('Failed to send message');

          return;
        }

        addMessage(queuedMessage);

        if (queuedMessage.agent_run_uuid) {
          startPolling(queuedMessage.id, queuedMessage.agent_run_uuid);
        } else {
          setIsSending(false);
        }
      })
      .catch((error) => {
        toast.error((error as Error).message);
        setIsSending(false);
      });
  };
  // Auto-send prompt from query param (e.g. ?prompt=...) on empty chat
  const autoPromptFired = useRef(false);

  useEffect(() => {
    const prompt = searchParams.get('prompt');

    if (!prompt || autoPromptFired.current || initialMessages.length > 0)
      return;

    autoPromptFired.current = true;

    // Clean URL without triggering navigation
    globalThis.history.replaceState(null, '', globalThis.location.pathname);

    setTimeout(() => {
      handleSend(prompt);
    }, 100);
  }, [searchParams]);

  let chatScopeLabel = 'Personal web chat';

  if ((chat.organization_id ?? null) !== null) {
    chatScopeLabel = chat.team_id
      ? `Fixed scope: Org #${chat.organization_id} · Team #${chat.team_id}`
      : `Fixed scope: Org #${chat.organization_id}`;
  }

  return (
    <div className='flex flex-col flex-1 min-h-0'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 h-[var(--topbar-height)] border-b border-border flex-shrink-0'>
        <div className='flex items-center gap-2'>
          {/* Mobile: back to chat list */}
          <button
            className='md:hidden flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer'
            onClick={() => {
              return router.push(ROUTES.DASHBOARD.CHAT);
            }}
            aria-label='Back to chats'
          >
            <ChevronLeft className='w-4 h-4' />
            Chats
          </button>

          {/* Desktop: icon + label */}
          <MessageSquare className='hidden md:block w-4 h-4 text-primary' />
          <div className='hidden md:flex flex-col'>
            <span className='text-sm font-semibold text-foreground'>
              {chat.title ?? 'Untitled chat'}
            </span>
            <span className='text-xs text-muted-foreground'>
              {chatScopeLabel}
            </span>
          </div>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className='hidden md:flex p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer'
            aria-label='Collapse chat panel'
          >
            <ChevronLeft className='w-4 h-4' />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        className='flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 flex flex-col gap-4'
      >
        {/* Top sentinel — triggers loading older messages */}
        <div ref={sentinelRef} />

        {isLoading && (
          <div className='flex justify-center py-2'>
            <span className='w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin block' />
          </div>
        )}

        {!hasMore && messages.length === 0 && !isSending && (
          <ChatSuggestions onSelect={handleSend} disabled={isSending} />
        )}

        {messages.map((msg) => {
          return <ChatMessage key={msg.id} message={msg} />;
        })}
      </div>

      {/* Input area */}
      <div className='flex-shrink-0 px-4 pb-4 pt-2'>
        {composerError ? (
          <div className='mb-3 rounded-[var(--radius-card)] border border-yellow-500/30 bg-yellow-500/10 p-4'>
            <div className='flex items-start gap-3'>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-medium text-foreground'>
                  Выберите рабочий контекст
                </p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Personal chat не требует постоянной привязки. Если backend
                  просит `organization_id`, переключите организацию в верхней
                  панели и повторите действие.
                </p>
                {composerError ? (
                  <p className='mt-2 text-sm text-destructive'>
                    {composerError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        <ChatInput
          onSend={handleSend}
          disabled={isSending}
          placeholder='Message…'
        />
      </div>
    </div>
  );
}
