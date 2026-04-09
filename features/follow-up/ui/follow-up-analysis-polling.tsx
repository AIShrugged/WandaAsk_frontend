'use client';

import { LayoutDashboard, RefreshCw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { ArtifactCard } from '@/entities/artifact';
import { getArtifacts } from '@/entities/artifact/api/artifacts';

import type { Artifact, ArtifactsResponse } from '@/entities/artifact';

const POLLING_INTERVAL_MS = 5000;

interface Props {
  chatId: number;
  initialArtifacts: ArtifactsResponse | null;
}

/**
 * Client component that renders follow-up analysis artifacts with live polling.
 * Fetches artifacts every 5 seconds so changes made in the methodology chat
 * appear without a page reload.
 * @param props - Component props.
 * @param props.chatId - ID of the methodology chat to poll artifacts from.
 * @param props.initialArtifacts - Pre-fetched artifacts from SSR for instant display.
 * @returns JSX element.
 */
export function FollowUpAnalysisPolling({ chatId, initialArtifacts }: Props) {
  const [artifacts, setArtifacts] = useState<ArtifactsResponse | null>(
    initialArtifacts,
  );
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

  if (items.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 gap-4 text-center'>
        <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
          <LayoutDashboard className='w-6 h-6 text-primary' />
        </div>
        <div className='max-w-sm'>
          <p className='text-sm font-medium text-foreground'>
            No analysis configured
          </p>
          <p className='text-sm text-muted-foreground mt-1 leading-relaxed'>
            No visual artifacts found for this methodology. Ask the AI to create
            evaluation charts or criteria cards in the methodology chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex justify-end'>
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
      </div>
      {items.map((artifact) => {
        return <ArtifactCard key={artifact.id} artifact={artifact} />;
      })}
    </div>
  );
}
