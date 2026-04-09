'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { updateOrganization } from '@/features/organization/api/organization';
import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button/Button';
import Input from '@/shared/ui/input/Input';
import InputDropdown from '@/shared/ui/input/InputDropdown';

import type {
  OrganizationIssueType,
  OrganizationIssueTypePayload,
} from '@/entities/organization';
import type {
  AgentProfile,
  AgentSelectOption,
} from '@/features/agents/model/types';

type IssueTypeRow = {
  key: string;
  name: string;
  base_type: 'development' | 'organization';
  agent_profile_id: string;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
};

const DEFAULT_ISSUE_TYPES: Array<
  Pick<
    IssueTypeRow,
    'key' | 'name' | 'base_type' | 'is_active' | 'metadata' | 'agent_profile_id'
  >
> = [
  {
    key: 'frontend',
    name: 'Frontend',
    base_type: 'development',
    agent_profile_id: '',
    is_active: true,
    metadata: null,
  },
  {
    key: 'backend',
    name: 'Backend',
    base_type: 'development',
    agent_profile_id: '',
    is_active: true,
    metadata: null,
  },
  {
    key: 'organization',
    name: 'Organization',
    base_type: 'organization',
    agent_profile_id: '',
    is_active: true,
    metadata: null,
  },
];

function buildRows(
  issueTypes: OrganizationIssueType[] | undefined,
): IssueTypeRow[] {
  const source =
    issueTypes && issueTypes.length > 0 ? issueTypes : DEFAULT_ISSUE_TYPES;

  return source.map((issueType) => {
    return {
      key: issueType.key,
      name: issueType.name,
      base_type: issueType.base_type as 'development' | 'organization',
      agent_profile_id: issueType.agent_profile_id
        ? String(issueType.agent_profile_id)
        : '',
      is_active: issueType.is_active,
      metadata: issueType.metadata ?? null,
    };
  });
}

/**
 * OrganizationIssueTypesSettings component.
 * @param root0
 * @param root0.organizationId
 * @param root0.issueTypes
 * @param root0.profiles
 * @returns JSX element.
 */
export function OrganizationIssueTypesSettings({
  organizationId,
  issueTypes,
  profiles,
}: {
  organizationId: number;
  issueTypes: OrganizationIssueType[] | undefined;
  profiles: AgentProfile[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initialRows = useMemo(() => {
    return buildRows(issueTypes);
  }, [issueTypes]);
  const [rows, setRows] = useState<IssueTypeRow[]>(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const profileOptions: AgentSelectOption[] = profiles.map((profile) => {
    return {
      value: String(profile.id),
      label: profile.name,
    };
  });

  const hasChanges = JSON.stringify(rows) !== JSON.stringify(initialRows);

  const updateRow = (index: number, patch: Partial<IssueTypeRow>): void => {
    setRows((current) => {
      return current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        return {
          ...row,
          ...patch,
        };
      });
    });
  };

  const onSubmit = (): void => {
    startTransition(async () => {
      const payload: OrganizationIssueTypePayload[] = rows.map((row) => {
        return {
          key: row.key,
          name: row.name.trim() || row.key,
          base_type: row.base_type,
          agent_profile_id: row.agent_profile_id
            ? Number(row.agent_profile_id)
            : null,
          is_active: row.is_active,
          metadata: row.metadata,
        };
      });

      try {
        await updateOrganization(organizationId, {
          issue_types: payload,
        });

        toast.success('Task types updated');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to update task types',
        );
      }
    });
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-3 rounded-[var(--radius-card)] border border-border p-4'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-sm font-medium text-foreground'>
              Task type to profile mapping
            </p>
            <p className='text-sm text-muted-foreground'>
              Each type resolves to exactly one agent profile. Profiles are
              managed in the agents section.
            </p>
          </div>
          <Link
            href={ROUTES.DASHBOARD.AGENTS}
            className='text-sm text-primary hover:underline'
          >
            Open agent profiles
          </Link>
        </div>

        <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
          <span>Repo payload example:</span>
          <Badge>github</Badge>
          <Badge>AIShrugged</Badge>
          <Badge>Tribes_backend</Badge>
        </div>
      </div>

      <div className='grid gap-4'>
        {rows.map((row, index) => {
          const selectedProfile = profiles.find((profile) => {
            return String(profile.id) === row.agent_profile_id;
          });

          return (
            <div
              key={row.key}
              className='rounded-[var(--radius-card)] border border-border p-4'
            >
              <div className='flex flex-col gap-4'>
                <div className='flex flex-wrap items-center gap-2'>
                  <p className='text-base font-medium text-foreground'>
                    {row.name}
                  </p>
                  <Badge>{row.key}</Badge>
                  <Badge>{row.base_type}</Badge>
                  {row.is_active ? (
                    <Badge>Active</Badge>
                  ) : (
                    <Badge>Disabled</Badge>
                  )}
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <Input
                    label='Type name'
                    value={row.name}
                    onChange={(event) => {
                      updateRow(index, { name: event.target.value });
                    }}
                  />
                  <InputDropdown
                    label='Agent profile'
                    options={profileOptions}
                    value={row.agent_profile_id}
                    onChange={(value) => {
                      updateRow(index, {
                        agent_profile_id: value as string,
                      });
                    }}
                    placeholder={
                      profiles.length > 0
                        ? 'Select agent profile'
                        : 'Create profiles first'
                    }
                    disabled={profiles.length === 0}
                    searchable
                  />
                </div>

                <div className='flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
                  <p>
                    {selectedProfile
                      ? `Selected profile: ${selectedProfile.name}`
                      : 'No profile selected yet'}
                  </p>
                  <p>Base type: {row.base_type}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className='flex justify-end'>
        <Button
          type='button'
          className='w-auto'
          loading={isPending}
          disabled={isPending || !hasChanges}
          onClick={onSubmit}
        >
          Save task types
        </Button>
      </div>
    </div>
  );
}
