'use client';

import clsx from 'clsx';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { deleteDemo } from '@/features/demo/api/delete-demo';
import { getDemoStatus } from '@/features/demo/api/get-demo-status';
import { seedDemo } from '@/features/demo/api/seed-demo';
import { DemoDropdown } from '@/features/demo/ui/demo-dropdown';
import { DemoOverlay } from '@/features/demo/ui/demo-overlay';
import { ROUTES } from '@/shared/lib/routes';

const POLLING_INTERVAL_MS = 2000;

const MAX_POLL_RETRIES = 150; // ~5 minutes at 2s interval

/**
 * DemoSeedButton component.
 * Renders a trigger button that opens a dropdown for configuring and generating
 * demo data. Polls the backend for progress and shows an overlay while generating.
 * @returns JSX element.
 */
// eslint-disable-next-line max-statements, complexity
export default function DemoSeedButton() {
  const [isOpen, setIsOpen] = useState(false);

  const [isPending, setIsPending] = useState(false);

  const [progressPercent, setProgressPercent] = useState<number | null>(null);

  const [stepLabel, setStepLabel] = useState<string | null>(null);

  const [teamsCount, setTeamsCount] = useState(1);

  const [employeesPerTeam, setEmployeesPerTeam] = useState(7);

  const [meetingsPerTeam, setMeetingsPerTeam] = useState(3);

  const [hasExistingDemo, setHasExistingDemo] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    right: number;
  } | null>(null);

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
    // eslint-disable-next-line max-statements, complexity
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
            router.push(ROUTES.AUTH.ORGANIZATION);
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

        if (status !== null) {
          setHasExistingDemo(true);

          if (status.status === 'generating' || status.status === 'pending') {
            setProgressPercent(status.progress_percent);
            setStepLabel(status.current_step_label);
            setIsPending(true);
            startPolling();
          }
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
      const target = e.target as HTMLElement;

      if (
        !buttonRef.current?.contains(target) &&
        !target.closest('[data-demo-dropdown]')
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
   * handleDelete.
   * @returns Promise.
   */
  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteDemo();

      if (result.error) {
        toast.error(result.error);

        return;
      }

      setHasExistingDemo(false);
      setIsOpen(false);
      toast.success('Demo data deleted.');
      router.refresh();
    } catch {
      toast.error('Failed to delete demo data.');
    } finally {
      if (mountedRef.current) setIsDeleting(false);
    }
  };

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
      {/* Trigger */}
      <button
        ref={buttonRef}
        onClick={() => {
          if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();

            setDropdownPos({
              top: rect.bottom + 8,
              right: Math.max(8, window.innerWidth - rect.right),
            });
          }

          setIsOpen((v) => {
            return !v;
          });
        }}
        disabled={isPending}
        className={clsx(
          'flex items-center gap-2 px-3 h-9 rounded-[var(--radius-button)] text-sm font-medium transition-all select-none border text-primary border-primary/40 bg-primary/10 shadow-[0_0_10px_rgba(124,58,237,0.2)]',
          !isPending &&
            isOpen &&
            'bg-primary/20 border-primary/60 shadow-[0_0_16px_rgba(124,58,237,0.35)]',
          !isPending &&
            !isOpen &&
            'hover:bg-primary/20 hover:border-primary/60 hover:shadow-[0_0_16px_rgba(124,58,237,0.35)] cursor-pointer',
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

      {isOpen &&
        dropdownPos &&
        createPortal(
          <div
            data-demo-dropdown=''
            className='fixed z-[9999]'
            style={{ top: dropdownPos.top, right: dropdownPos.right }}
          >
            <DemoDropdown
              teamsCount={teamsCount}
              employeesPerTeam={employeesPerTeam}
              meetingsPerTeam={meetingsPerTeam}
              hasExistingDemo={hasExistingDemo}
              isDeleting={isDeleting}
              onTeamsCountChange={setTeamsCount}
              onEmployeesPerTeamChange={setEmployeesPerTeam}
              onMeetingsPerTeamChange={setMeetingsPerTeam}
              onGenerate={handleGenerate}
              onDelete={handleDelete}
            />
          </div>,
          document.body,
        )}

      {isPending && (
        <DemoOverlay progressPercent={progressPercent} stepLabel={stepLabel} />
      )}
    </>
  );
}
