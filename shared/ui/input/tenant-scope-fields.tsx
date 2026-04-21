'use client';

import { useEffect, useState } from 'react';

import InputDropdown from '@/shared/ui/input/InputDropdown';

import type { OrganizationProps } from '@/entities/organization';
import type { TeamProps } from '@/entities/team';

interface TenantScopeFieldsProps {
  organizations: OrganizationProps[];
  organizationId: string;
  teamId: string;
  onOrganizationChange: (value: string) => void;
  onTeamChange: (value: string) => void;
  fetchTeams: (organizationId: string) => Promise<{ data: TeamProps[] | null }>;
  organizationError?: string;
  teamError?: string;
  disabled?: boolean;
}

/**
 * TenantScopeFields renders organization/team selectors with dependent teams.
 * @param props - component props.
 * @param props.organizations
 * @param props.organizationId
 * @param props.teamId
 * @param props.onOrganizationChange
 * @param props.onTeamChange
 * @param props.fetchTeams
 * @param props.organizationError
 * @param props.teamError
 * @param props.disabled
 * @returns JSX element.
 */
export function TenantScopeFields({
  organizations,
  organizationId,
  teamId,
  onOrganizationChange,
  onTeamChange,
  fetchTeams,
  organizationError,
  teamError,
  disabled,
}: TenantScopeFieldsProps) {
  const [teams, setTeams] = useState<TeamProps[]>([]);
  const [isTeamsLoading, setIsTeamsLoading] = useState(false);
  const [teamsLoaded, setTeamsLoaded] = useState(false);

  useEffect(() => {
    if (!organizationId) {
      if (teamId) onTeamChange('');

      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTeamsLoading(true);

    fetchTeams(organizationId)
      .then(({ data }) => {
        setTeams(data ?? []);
      })
      .catch(() => {
        setTeams([]);
      })
      .finally(() => {
        setIsTeamsLoading(false);
        setTeamsLoaded(true);
      });
  }, [organizationId]);

  useEffect(() => {
    if (!teamsLoaded || !teamId) return;

    const teamExists = teams.some((team) => {
      return String(team.id) === teamId;
    });

    if (!teamExists) {
      onTeamChange('');
    }
  }, [teams, teamId, teamsLoaded]);

  const organizationOptions = [
    { value: '', label: 'No organization' },
    ...organizations.map((organization) => {
      return {
        value: String(organization.id),
        label: organization.name,
      };
    }),
  ];
  const teamOptions = [
    { value: '', label: 'No team' },
    ...teams.map((team) => {
      return {
        value: String(team.id),
        label: team.name,
      };
    }),
  ];
  let teamPlaceholder = 'Select organization first';

  if (organizationId) {
    teamPlaceholder = isTeamsLoading ? 'Loading teams' : 'Optional team';
  }

  return (
    <div className='grid gap-2 md:grid-cols-2'>
      <InputDropdown
        label='Organization'
        placeholder='Select organization'
        options={organizationOptions}
        value={organizationId}
        onChange={(value) => {
          onOrganizationChange(value as string);
        }}
        error={organizationError}
        disabled={disabled}
        searchable
      />
      <InputDropdown
        label='Team'
        placeholder={teamPlaceholder}
        options={teamOptions}
        value={teamId}
        onChange={(value) => {
          onTeamChange(value as string);
        }}
        error={teamError}
        disabled={disabled || !organizationId || isTeamsLoading}
        searchable
      />
    </div>
  );
}
