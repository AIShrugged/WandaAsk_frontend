'use client';

import { ChevronLeft, RefreshCw, Sparkles } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { ArtifactCard } from '@/entities/artifact';
import { getArtifacts } from '@/entities/artifact/api/artifacts';
import { CollapsedSidePanel } from '@/shared/ui/layout/collapsed-side-panel';

import type { Artifact, ArtifactsResponse } from '@/features/chat/types';

const POLLING_INTERVAL_MS = 5000;

interface ArtifactPanelProps {
  chatId: number;
  initialArtifacts: ArtifactsResponse | null;
}

/**
 * ArtifactPanel component.
 * @param root0 - Component props.
 * @param root0.chatId - The chat ID to poll artifacts for.
 * @param root0.initialArtifacts - Pre-loaded artifacts response.
 * @returns JSX element.
 */
export function ArtifactPanel({
  chatId,
  initialArtifacts,
}: ArtifactPanelProps) {
  const [artifacts, setArtifacts] = useState<ArtifactsResponse | null>(
    initialArtifacts,
  );

  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const mountedRef = useRef(true);

  const pollingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    pollingRef.current = true;

    /**
     * poll.
     * @returns Promise.
     */
    const poll = async () => {
      if (!pollingRef.current || !mountedRef.current) return;

      try {
        const data = await getArtifacts(chatId);

        if (mountedRef.current) setArtifacts(data);
      } catch {
        /* keep previous data */
      }

      if (pollingRef.current && mountedRef.current) {
        setTimeout(poll, POLLING_INTERVAL_MS);
      }
    };

    const timerId = setTimeout(poll, POLLING_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      pollingRef.current = false;
      clearTimeout(timerId);
    };
  }, [chatId]);

  /**
   * handleRefresh.
   * @returns Promise.
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getArtifacts(chatId);

      if (mountedRef.current) setArtifacts(data);
    } catch {
      /* keep */
    } finally {
      if (mountedRef.current) setIsRefreshing(false);
    }
  };

  const items = (artifacts?.layout?.items ?? [])
    .map((item) => {
      return artifacts!.artifacts[item.id];
    })
    .filter(Boolean) as Artifact[];

  // ── Collapsed state ──────────────────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <CollapsedSidePanel
        label='Artifacts'
        onExpand={() => {
          return setIsCollapsed(false);
        }}
      />
    );
  }

  // ── Open state ───────────────────────────────────────────────────────────────
  return (
    <div className='flex-1 min-w-0 min-h-0 flex flex-col border-r border-border bg-sidebar'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 h-[var(--topbar-height)] border-b border-border flex-shrink-0'>
        <div className='flex items-center gap-2'>
          <Sparkles className='w-4 h-4 text-primary' />
          <span className='text-sm font-semibold text-foreground'>
            Artifacts
          </span>
          {items.length > 0 && (
            <span className='text-xs bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-full'>
              {items.length}
            </span>
          )}
        </div>
        <div className='flex items-center gap-1'>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className='p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer'
            aria-label='Refresh artifacts'
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => {
              return setIsCollapsed(true);
            }}
            className='p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer'
            aria-label='Collapse artifacts panel'
          >
            <ChevronLeft className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-4'>
        {items.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full gap-3 text-center px-4'>
            <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
              <Sparkles className='w-5 h-5 text-primary' />
            </div>
            <div>
              <p className='text-sm font-medium text-foreground'>
                No artifacts yet
              </p>
              <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>
                Artifacts will appear here as the AI analyzes the conversation
              </p>
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {items.map((artifact) => {
              return <ArtifactCard key={artifact.id} artifact={artifact} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
