'use client';

import clsx from 'clsx';
import { Minus, Plus, Sparkles, Trash2 } from 'lucide-react';

import { Button } from '@/shared/ui/button/Button';

const TEAMS_COUNT_OPTIONS = [1, 2, 3] as const;
const MEETINGS_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
const EMPLOYEES_MIN = 3;
const EMPLOYEES_MAX = 10;
const LABEL_CLASS = 'text-xs font-medium text-muted-foreground';

interface DemoDropdownProps {
  teamsCount: number;
  employeesPerTeam: number;
  meetingsPerTeam: number;
  hasExistingDemo: boolean;
  isDeleting: boolean;
  onTeamsCountChange: (v: number) => void;
  onEmployeesPerTeamChange: (v: number) => void;
  onMeetingsPerTeamChange: (v: number) => void;
  onGenerate: () => void;
  onDelete: () => void;
}

/**
 * SegmentedControl component.
 * @param root0 - Component props.
 * @param root0.value - Selected value.
 * @param root0.options - Available options.
 * @param root0.onChange - Change handler.
 * @returns JSX element.
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
 * @param root0 - Component props.
 * @param root0.value - Current value.
 * @param root0.min - Minimum value.
 * @param root0.max - Maximum value.
 * @param root0.onChange - Change handler.
 * @returns JSX element.
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
 * DemoDropdown — configuration panel for generating demo data.
 * @param root0 - Component props.
 * @param root0.teamsCount - Number of teams to generate.
 * @param root0.employeesPerTeam - Employees per team.
 * @param root0.meetingsPerTeam - Meetings per team.
 * @param root0.hasExistingDemo - Whether demo data already exists.
 * @param root0.isDeleting - Whether deletion is in progress.
 * @param root0.onTeamsCountChange - Handler for teams count change.
 * @param root0.onEmployeesPerTeamChange - Handler for employees per team change.
 * @param root0.onMeetingsPerTeamChange - Handler for meetings per team change.
 * @param root0.onGenerate - Handler for generate button click.
 * @param root0.onDelete - Handler for delete button click.
 * @returns JSX element.
 */
export function DemoDropdown({
  teamsCount,
  employeesPerTeam,
  meetingsPerTeam,
  hasExistingDemo,
  isDeleting,
  onTeamsCountChange,
  onEmployeesPerTeamChange,
  onMeetingsPerTeamChange,
  onGenerate,
  onDelete,
}: DemoDropdownProps) {
  return (
    <div className='w-72 bg-popover border border-border rounded-[var(--radius-card)] shadow-card p-4'>
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
            onChange={onTeamsCountChange}
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
            onChange={onEmployeesPerTeamChange}
          />
        </div>

        {/* Meetings per team */}
        <div className='flex flex-col gap-1.5'>
          <span className={LABEL_CLASS}>Meetings per team</span>
          <SegmentedControl
            value={meetingsPerTeam}
            options={MEETINGS_OPTIONS}
            onChange={onMeetingsPerTeamChange}
          />
        </div>

        <div className='pt-1 border-t border-border flex flex-col gap-2'>
          <Button type='button' onClick={onGenerate} disabled={isDeleting}>
            Generate
          </Button>

          {hasExistingDemo && (
            <button
              type='button'
              onClick={onDelete}
              disabled={isDeleting}
              className='flex items-center justify-center gap-1.5 w-full h-8 rounded-[var(--radius-button)] text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
            >
              {isDeleting ? (
                <div className='w-3 h-3 border-2 border-destructive border-t-transparent rounded-full animate-spin' />
              ) : (
                <Trash2 className='w-3 h-3' />
              )}
              {isDeleting ? 'Deleting\u2026' : 'Delete demo data'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
