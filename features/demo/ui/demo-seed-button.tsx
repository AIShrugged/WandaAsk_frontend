'use client';

import clsx from 'clsx';
import { Minus, Plus, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { getDemoStatus } from '@/features/demo/api/get-demo-status';
import { seedDemo } from '@/features/demo/api/seed-demo';
import { Button } from '@/shared/ui/button/Button';
import SpinLoader from '@/shared/ui/layout/spin-loader';

const TEAMS_COUNT_OPTIONS = [1, 2, 3] as const;

const MEETINGS_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

const EMPLOYEES_MIN = 3;

const EMPLOYEES_MAX = 10;

const LABEL_CLASS = 'text-xs font-medium text-muted-foreground';

const POLLING_INTERVAL_MS = 2000;

const MAX_POLL_RETRIES = 150; // ~5 minutes at 2s interval

/**
 * SegmentedControl component.
 * @param root0
 * @param root0.value
 * @param root0.options
 * @param root0.onChange
 */
function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: number;
  options: readonly number[];
  onChange: (v: number) => void;
}) {
  return (
    <div className='flex rounded-[var(--radius-button)] border border-input bg-muted p-0.5 gap-0.5'>
      {options.map((opt) => {
        return (
          <button
            key={opt}
            type='button'
            onClick={() => {
              return onChange(opt);
            }}
            className={clsx(
              'flex-1 h-7 text-xs rounded-sm font-medium transition-all cursor-pointer',
              opt === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Stepper component.
 * @param root0
 * @param root0.value
 * @param root0.min
 * @param root0.max
 * @param root0.onChange
 */
function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className='flex items-center border border-input rounded-[var(--radius-button)] overflow-hidden'>
      <button
        type='button'
        onClick={() => {
          return onChange(Math.max(min, value - 1));
        }}
        disabled={value === min}
        className='w-9 h-8 flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-r border-input'
      >
        <Minus className='w-3 h-3' />
      </button>
      <span className='flex-1 text-center text-sm font-semibold text-foreground tabular-nums select-none'>
        {value}
      </span>
      <button
        type='button'
        onClick={() => {
          return onChange(Math.min(max, value + 1));
        }}
        disabled={value === max}
        className='w-9 h-8 flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-l border-input'
      >
        <Plus className='w-3 h-3' />
      </button>
    </div>
  );
}

/**
 * DemoSeedButton component.
 */
export default function DemoSeedButton() {
  const [isOpen, setIsOpen] = useState(false);

  const [isPending, setIsPending] = useState(false);

  const [progressPercent, setProgressPercent] = useState<number | null>(null);

  const [stepLabel, setStepLabel] = useState<string | null>(null);

  const [teamsCount, setTeamsCount] = useState(1);

  const [employeesPerTeam, setEmployeesPerTeam] = useState(7);

  const [meetingsPerTeam, setMeetingsPerTeam] = useState(3);

  const containerRef = useRef<HTMLDivElement>(null);

  const pollingRef = useRef(false);

  const pollCountRef = useRef(0);

  const mountedRef = useRef(true);

  const router = useRouter();

  /**
   * stopPolling.
   */
  const stopPolling = () => {
    pollingRef.current = false;

    if (mountedRef.current) {
      setIsPending(false);
      setProgressPercent(null);
      setStepLabel(null);
    }
  };

  /**
   * startPolling.
   */
  const startPolling = () => {
    pollingRef.current = true;
    pollCountRef.current = 0;

    /**
     * poll.
     * @returns Promise.
     */
    const poll = async () => {
      if (!pollingRef.current || !mountedRef.current) return;

      if (pollCountRef.current >= MAX_POLL_RETRIES) {
        stopPolling();
        toast.error('Demo generation timed out. Please try again.');

        return;
      }

      pollCountRef.current += 1;

      try {
        const status = await getDemoStatus();

        if (!pollingRef.current || !mountedRef.current) return;

        if (status === null) {
          // 404 — generation not found yet, continue polling
          setTimeout(poll, POLLING_INTERVAL_MS);

          return;
        }

        setProgressPercent(status.progress_percent);
        setStepLabel(status.current_step_label);

        if (status.status === 'ready') {
          pollingRef.current = false;
          setTimeout(() => {
            if (!mountedRef.current) return;
            setIsPending(false);
            setProgressPercent(null);
            setStepLabel(null);
            toast.success('Demo data is ready!');
            router.push('/auth/organization');
          }, 600);

          return;
        }

        if (status.status === 'failed') {
          stopPolling();
          toast.error(status.error ?? 'Demo generation failed.');

          return;
        }

        // status === 'generating' | 'pending' — keep polling
        setTimeout(poll, POLLING_INTERVAL_MS);
      } catch (error) {
        if (!pollingRef.current || !mountedRef.current) return;
        stopPolling();
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to check demo status.',
        );
      }
    };

    poll();
  };

  useEffect(() => {
    /**
     * checkInitialStatus.
     * @returns Promise.
     */
    const checkInitialStatus = async () => {
      try {
        const status = await getDemoStatus();

        if (!mountedRef.current) return;

        if (
          status !== null &&
          (status.status === 'generating' || status.status === 'pending')
        ) {
          setProgressPercent(status.progress_percent);
          setStepLabel(status.current_step_label);
          setIsPending(true);
          startPolling();
        }
      } catch {
        // silently ignore — just show the normal button
      }
    };

    checkInitialStatus();

    return () => {
      mountedRef.current = false;
      pollingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    /**
     * handleClickOutside.
     * @param e - e.
     * @returns Result.
     */
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      return document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * handleGenerate.
   * @returns Promise.
   */
  const handleGenerate = async () => {
    setIsOpen(false);
    setIsPending(true);
    setProgressPercent(null);
    setStepLabel(null);

    try {
      await seedDemo({
        teams_count: teamsCount,
        employees_per_team: employeesPerTeam,
        meetings_per_team: meetingsPerTeam,
      });
      startPolling();
    } catch (error) {
      setIsPending(false);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate demo data',
      );
    }
  };

  return (
    <>
      <div ref={containerRef} className='relative'>
        {/* Trigger */}
        <button
          onClick={() => {
            return setIsOpen((v) => {
              return !v;
            });
          }}
          disabled={isPending}
          className={clsx(
            'flex items-center gap-2 px-3 h-9 rounded-[var(--radius-button)] text-sm font-medium transition-all select-none border text-primary border-primary/20',
            !isPending && isOpen && 'bg-primary/10 border-primary/30',
            !isPending &&
              !isOpen &&
              'hover:bg-primary/10 hover:border-primary/30 cursor-pointer',
            isPending && 'opacity-70 cursor-not-allowed',
          )}
          aria-label='Generate demo data'
          aria-expanded={isOpen}
          aria-busy={isPending}
        >
          {isPending ? (
            <div className='w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0' />
          ) : (
            <Sparkles className='w-3.5 h-3.5 flex-shrink-0' />
          )}
          <span className='hidden sm:block'>
            {isPending ? 'Demo generating\u2026' : 'Create Demo'}
          </span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className='absolute top-full right-0 mt-2 w-72 bg-popover border border-border rounded-[var(--radius-card)] shadow-card p-4 z-50'>
            {/* Header */}
            <div className='flex items-center gap-2.5 mb-4'>
              <div className='w-7 h-7 rounded-[var(--radius-button)] bg-primary/10 flex items-center justify-center flex-shrink-0'>
                <Sparkles className='w-3.5 h-3.5 text-primary' />
              </div>
              <div>
                <p className='text-sm font-semibold text-foreground leading-tight'>
                  Demo data
                </p>
                <p className='text-xs text-muted-foreground leading-tight'>
                  Configure and generate
                </p>
              </div>
            </div>

            <div className='flex flex-col gap-4'>
              {/* Teams count */}
              <div className='flex flex-col gap-1.5'>
                <span className={LABEL_CLASS}>Teams</span>
                <SegmentedControl
                  value={teamsCount}
                  options={TEAMS_COUNT_OPTIONS}
                  onChange={setTeamsCount}
                />
              </div>

              {/* Employees per team */}
              <div className='flex flex-col gap-1.5'>
                <div className='flex items-center justify-between'>
                  <span className={LABEL_CLASS}>Employees per team</span>
                  <span className='text-xs text-muted-foreground'>
                    {EMPLOYEES_MIN}
                    {'\u2013'}
                    {EMPLOYEES_MAX}
                  </span>
                </div>
                <Stepper
                  value={employeesPerTeam}
                  min={EMPLOYEES_MIN}
                  max={EMPLOYEES_MAX}
                  onChange={setEmployeesPerTeam}
                />
              </div>

              {/* Meetings per team */}
              <div className='flex flex-col gap-1.5'>
                <span className={LABEL_CLASS}>Meetings per team</span>
                <SegmentedControl
                  value={meetingsPerTeam}
                  options={MEETINGS_OPTIONS}
                  onChange={setMeetingsPerTeam}
                />
              </div>

              <div className='pt-1 border-t border-border'>
                <Button type='button' onClick={handleGenerate}>
                  Generate
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full-page loading overlay */}
      {isPending &&
        createPortal(
          <div className='fixed inset-0 bg-background/70 backdrop-blur-sm z-[9999] flex items-center justify-center'>
            <div className='bg-card border border-border rounded-[var(--radius-card)] shadow-card p-6 flex flex-col gap-3 w-72'>
              {/* Title + percent */}
              <div className='flex items-center justify-between'>
                <p className='text-sm font-semibold text-foreground'>
                  Generating demo
                </p>
                {progressPercent !== null && (
                  <span className='text-sm font-bold text-primary tabular-nums'>
                    {progressPercent}%
                  </span>
                )}
              </div>

              {/* Progress bar or spinner */}
              {progressPercent === null ? (
                <div className='flex justify-center py-2'>
                  <SpinLoader />
                </div>
              ) : (
                <div className='w-full bg-muted rounded-full h-1.5 overflow-hidden'>
                  <div
                    className='h-full bg-primary transition-all duration-500 rounded-full'
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Step label or hint */}
              <p className='text-xs text-muted-foreground'>
                {stepLabel ?? 'This may take up to 10 minutes'}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
