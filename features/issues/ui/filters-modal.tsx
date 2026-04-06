'use client';

import { ISSUE_STATUS_OPTIONS } from '@/features/issues/model/types';
import { getTeams } from '@/features/teams/api/team';
import InputDropdown from '@/shared/ui/input/InputDropdown';
import { TenantScopeFields } from '@/shared/ui/input/tenant-scope-fields';
import { Modal } from '@/shared/ui/modal/modal';

import type { OrganizationProps } from '@/entities/organization';
import type {
  IssueStatus,
  IssueType,
  PersonOption,
  SharedFilters,
} from '@/features/issues/model/types';

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
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
 * FiltersModal component - modal dialog with filter options.
 * @param props - component props.
 * @param props.isOpen - whether the modal is open.
 * @param props.onClose - callback to close the modal.
 * @param props.filters - current filter values.
 * @param props.organizations - organizations list.
 * @param props.persons - persons list for assignee dropdown.
 * @param props.onChange - called when any filter changes.
 * @param props.disabled - disables all controls when true.
 * @returns JSX element.
 */
export function FiltersModal({
  isOpen,
  onClose,
  filters,
  organizations,
  persons,
  onChange,
  disabled,
}: FiltersModalProps) {
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
    <Modal isOpen={isOpen} onClose={onClose} title='Filters'>
      <div className='flex flex-col gap-4'>
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

        <div className='grid gap-4 sm:grid-cols-2'>
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
    </Modal>
  );
}
