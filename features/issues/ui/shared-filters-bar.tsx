'use client';

import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ISSUE_STATUS_OPTIONS } from '@/features/issues/model/types';
import { getTeams } from '@/features/teams/api/team';
import { ROUTES } from '@/shared/lib/routes';
import InputDropdown from '@/shared/ui/input/InputDropdown';
import { TenantScopeFields } from '@/shared/ui/input/tenant-scope-fields';

import type { OrganizationProps } from '@/entities/organization';
import type {
  IssueStatus,
  IssueType,
  PersonOption,
  SharedFilters,
} from '@/features/issues/model/types';

interface SharedFiltersBarProps {
  filters: SharedFilters;
  organizations: OrganizationProps[];
  persons: PersonOption[];
  onChange: (patch: Partial<SharedFilters>) => void;
  disabled?: boolean;
}

const TYPE_OPTIONS = [
  { value: '', label: 'Any type' },
  { value: 'development', label: 'Development' },
  { value: 'organization', label: 'Organization' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  ...ISSUE_STATUS_OPTIONS,
];

/**
 * SharedFiltersBar renders the filter controls shared across Tasktracker and Kanban tabs.
 * @param props - component props.
 * @param props.filters - current filter values.
 * @param props.organizations - organizations list.
 * @param props.persons - persons list for assignee dropdown.
 * @param props.onChange - called when any filter changes.
 * @param props.disabled - disables all controls when true.
 * @returns JSX element.
 */
export function SharedFiltersBar({
  filters,
  organizations,
  persons,
  onChange,
  disabled,
}: SharedFiltersBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  // Debounce search: propagate 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ search: searchValue });
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchValue]);

  const personOptions = [
    { value: '', label: 'Any assignee' },
    ...persons.map((person) => {
      return {
        value: String(person.id),
        label: person.email ? `${person.name} (${person.email})` : person.name,
      };
    }),
  ];

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
        <Link
          href={`${ROUTES.DASHBOARD.ISSUES}/create`}
          className='inline-flex h-10 w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] bg-gradient-to-b from-violet-500 to-violet-700 px-4 text-sm font-medium text-primary-foreground shadow-[0_2px_12px_rgba(124,58,237,0.25)] transition-all hover:from-violet-400 hover:to-violet-600'
        >
          <Plus className='h-4 w-4' />
          New issue
        </Link>
      </div>

      <div className='grid gap-2 rounded-[var(--radius-card)] border border-border bg-card p-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <input
            type='text'
            placeholder='Search by name...'
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
            disabled={disabled}
            className='h-10 w-full rounded-[var(--radius-button)] border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'
          />
        </div>

        <TenantScopeFields
          organizations={organizations}
          organizationId={filters.organization_id}
          teamId={filters.team_id}
          fetchTeams={getTeams}
          onOrganizationChange={(value) => {
            onChange({ organization_id: value, team_id: '' });
          }}
          onTeamChange={(value) => {
            onChange({ team_id: value });
          }}
          disabled={disabled}
        />

        <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-4'>
          <InputDropdown
            label='Status'
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(value) => {
              onChange({ status: value as IssueStatus | '' });
            }}
            disabled={disabled}
          />
          <InputDropdown
            label='Type'
            options={TYPE_OPTIONS}
            value={filters.type}
            onChange={(value) => {
              onChange({ type: value as IssueType | '' });
            }}
            disabled={disabled}
          />
          <InputDropdown
            label='Assignee'
            options={personOptions}
            value={filters.assignee_id}
            onChange={(value) => {
              onChange({ assignee_id: value as string });
            }}
            searchable
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
