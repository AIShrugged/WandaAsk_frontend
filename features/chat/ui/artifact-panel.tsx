'use client';

import { ChevronLeft, RefreshCw, Sparkles } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { ArtifactCard, getArtifacts } from '@/entities/artifact';
import { ButtonIcon } from '@/shared/ui/button';
import { CollapsedSidePanel } from '@/shared/ui/layout/collapsed-side-panel';

import type { Artifact, ArtifactsResponse } from '@/features/chat/model/types';

const POLLING_INTERVAL_MS = 5000;

interface ArtifactPanelProps {
  chatId: number;
  initialArtifacts: ArtifactsResponse | null;
}

export function ArtifactPanel({
  chatId,
  initialArtifacts,
}: ArtifactPanelProps) {
  const [artifacts, setArtifacts] = useState<ArtifactsResponse | null>(
    initialArtifacts,
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Effect-local flag — each effect invocation has its own boolean.
    // A shared useRef would be reset to true by the new effect before the old
    // in-flight await resolves, causing a ghost poll loop when chatId changes.
    let active = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (!active) return;
      try {
        const data = await getArtifacts(chatId);
        if (active) setArtifacts(data);
      } catch {
        /* keep previous data */
      }
      if (active) timerId = setTimeout(poll, POLLING_INTERVAL_MS);
    };

    timerId = setTimeout(poll, POLLING_INTERVAL_MS);

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [chatId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getArtifacts(chatId);
      setArtifacts(data);
    } catch {
      /* keep */
    } finally {
      setIsRefreshing(false);
    }
  }, [chatId]);
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
            <span
              aria-label={`${items.length} artifacts`}
              className='text-xs bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-full'
            >
              {items.length}
            </span>
          )}
        </div>
        <div className='flex items-center gap-1'>
          <ButtonIcon
            aria-label='Refresh artifacts'
            icon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            }
            variant='ghost'
            size='sm'
            disabled={isRefreshing}
            onClickAction={handleRefresh}
          />
          <ButtonIcon
            aria-label='Collapse artifacts panel'
            icon={<ChevronLeft className='w-4 h-4' />}
            variant='ghost'
            size='sm'
            onClickAction={() => {
              return setIsCollapsed(true);
            }}
          />
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
